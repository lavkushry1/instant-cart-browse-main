import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Plus, Upload, Trash2, Save, Loader2, Bold, Italic, Underline } from 'lucide-react'; // Added Bold, Italic, Underline
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '../../services/productService';
import { Category } from '../../services/categoryService';
import AdminLayout from '../../components/layout/AdminLayout';

import { functionsClient, firebaseApp } from '../../lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';
import { Timestamp as ClientTimestamp, doc, collection, getFirestore } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Define types for product creation and update, based on client-side Product type
export type ProductCreationData = Omit<Product, 'id' | 'averageRating' | 'reviewCount' | 'createdAt' | 'updatedAt'> & { 
  id?: string; // Allow pre-generated ID for creation
};
export type ProductUpdateData = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

// Define direct response types for Cloud Functions
interface CreateProductAdminResponse { success: boolean; product?: Product; error?: string; }
interface GetProductByIdAdminResponse { success: boolean; product?: Product; error?: string; }
interface UpdateProductAdminResponse { success: boolean; product?: Product; error?: string; }
interface GetAllCategoriesAdminResponse { success: boolean; categories?: Category[]; error?: string; } // Potentially re-usable

let createProductAdminCF: HttpsCallable<ProductCreationData, CreateProductAdminResponse> | undefined;
let getProductByIdAdminCF: HttpsCallable<{ productId: string }, GetProductByIdAdminResponse> | undefined;
let updateProductAdminCF: HttpsCallable<{ productId: string; updateData: ProductUpdateData }, UpdateProductAdminResponse> | undefined;
let getAllCategoriesAdminCF: HttpsCallable<void, GetAllCategoriesAdminResponse> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    createProductAdminCF = httpsCallable(functionsClient, 'products-createProductCF');
    getProductByIdAdminCF = httpsCallable(functionsClient, 'products-getProductByIdCF');
    updateProductAdminCF = httpsCallable(functionsClient, 'products-updateProductCF');
    getAllCategoriesAdminCF = httpsCallable(functionsClient, 'categories-getAllCategoriesCF');
    console.log("ProductForm: Live httpsCallable references created.");
  } catch (error) {
    console.error("ProductForm: Error preparing httpsCallable functions:", error);
    toast.error("Error initializing connection to product/category services.");
  }
} else {
    console.warn("ProductForm: Firebase functions client not available. Operations will be mocked or fail.");
}

// Fallback Mocks if live functions are not available
const fallbackGetProductById = async (productId: string): Promise<HttpsCallableResult<{success: boolean; product?: Product; error?: string}>> => {
    console.warn(`MOCK getProductByIdCF for ${productId}`);
    if (productId === 'existing_id') return { data: { success: true, product: { id: 'existing_id', name: 'Fetched Mock Product', description: 'Desc', price: 99, categoryId: 'cat1', stock: 10, images:['/placeholder.svg'], tags:['test'], isEnabled: true, featured: false, createdAt: ClientTimestamp.fromDate(new Date()), updatedAt: ClientTimestamp.fromDate(new Date()) } as Product } };
    return { data: { success: false, error: 'Mock Product not found' } };
};
const fallbackGetAllCategories = async (): Promise<HttpsCallableResult<{success: boolean; categories?: Category[]; error?: string}>> => {
    console.warn("MOCK getAllCategoriesCF");
    return { data: { success: true, categories: [{id: 'cat1', name: 'Electronics', slug:'', isEnabled:true, createdAt: ClientTimestamp.fromDate(new Date()), updatedAt: ClientTimestamp.fromDate(new Date())}, {id: 'cat2', name: 'Books', slug:'', isEnabled:true, createdAt: ClientTimestamp.fromDate(new Date()), updatedAt: ClientTimestamp.fromDate(new Date())}] } };
};
const fallbackCreateProduct = async (data: ProductCreationData): Promise<HttpsCallableResult<{success: boolean; product?: Product; error?: string}>> => {
    console.warn("MOCK createProductCF", data);
    return { data: { success: true, product: {id: `new_mock_${Date.now()}`, ...data, createdAt: ClientTimestamp.fromDate(new Date()), updatedAt: ClientTimestamp.fromDate(new Date())} as Product } };
};
const fallbackUpdateProduct = async (productId: string, data: ProductUpdateData): Promise<HttpsCallableResult<{success: boolean; product?: Product; error?: string}>> => {
    console.warn("MOCK updateProductCF", productId, data);
    return { data: { success: true, product: {id: productId, ...data, name: data.name || "Updated Mock", price: data.price || 0, categoryId: data.categoryId || "mockCat", stock: data.stock || 0, images: data.images || [], isEnabled: data.isEnabled === undefined ? true : data.isEnabled, createdAt: ClientTimestamp.fromDate(new Date()), updatedAt: ClientTimestamp.fromDate(new Date()) } as Product } };
};


const emptyProductForm: ProductCreationData = {
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  sku: '',
  categoryId: '',
  categoryName: '',
  stock: 0,
  images: [],
  tags: [],
  isEnabled: true,
  featured: false,
  allowBackorders: false, // Added allowBackorders
  slug: '',
  seoTitle: '',
  seoDescription: '',
};

// Client-side slug generation helper (duplicate from backend for now)
const generateSlugForClient = (name: string): string => {
  if (!name) return ''; 
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')         
    .replace(/-+$/, '');        
};

const ProductForm = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const isEditMode = productId !== undefined && productId !== 'new';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>(emptyProductForm);
  const [activeTab, setActiveTab] = useState('basic');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrlsToKeep, setImageUrlsToKeep] = useState<string[]>([]);

  const fetchProductAndDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      let catCallResult: HttpsCallableResult<GetAllCategoriesAdminResponse>;
      if (getAllCategoriesAdminCF) {
        catCallResult = await getAllCategoriesAdminCF();
      } else {
        catCallResult = await fallbackGetAllCategories();
      }
      const catResponseData = catCallResult.data;
      if (catResponseData.success && catResponseData.categories) setAvailableCategories(catResponseData.categories);
      else toast.error(catResponseData.error || 'Failed to load categories');

      if (isEditMode && productId) {
        let prodCallResult: HttpsCallableResult<GetProductByIdAdminResponse>;
        if (getProductByIdAdminCF) {
          prodCallResult = await getProductByIdAdminCF({ productId });
        } else {
          prodCallResult = await fallbackGetProductById(productId);
        }
        const prodResponseData = prodCallResult.data;
        if (prodResponseData.success && prodResponseData.product) setFormData(prodResponseData.product);
        else { toast.error(prodResponseData.error || 'Failed to load product'); navigate('/admin/products'); }
      } else {
        setFormData(emptyProductForm);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error(`Init error: ${e.message}`); navigate('/admin/products'); }
    setIsLoading(false);
  }, [productId, isEditMode, navigate]);

  useEffect(() => { fetchProductAndDependencies(); }, [fetchProductAndDependencies]);

  useEffect(() => {
    if (isEditMode && formData.images && formData.images.length > 0) {
      setImageUrlsToKeep(formData.images);
    } else if (!isEditMode) { // Clear for new product form after editing one
      setImageUrlsToKeep([]);
      setImageFiles([]);
    }
  }, [isEditMode, formData.images]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newForm = { ...prev, [name]: value };
      // Auto-generate slug from name if name is changed and slug is empty
      if (name === 'name' && (!newForm.slug || newForm.slug.trim() === '')) {
        newForm.slug = generateSlugForClient(value);
      }
      return newForm;
    });
  };
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  const handleCategoryChange = (value: string) => setFormData(prev => ({ ...prev, categoryId: value }));
  const handleToggleChange = (field: keyof Product) => (checked: boolean) => setFormData(prev => ({ ...prev, [field]: checked }));
  const handleImagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({...prev, images: e.target.value.split(',').map(s=>s.trim()).filter(s=>s)}));
  const handleTagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({...prev, tags: e.target.value.split(',').map(s=>s.trim()).filter(s=>s)}));

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveExistingImage = (urlToRemove: string) => {
    setImageUrlsToKeep(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleRemoveNewImageFile = (fileNameToRemove: string) => {
    setImageFiles(prev => prev.filter(file => file.name !== fileNameToRemove));
  };

  // Helper function to upload images and get their URLs
  const uploadImages = async (files: File[], currentProductId?: string): Promise<string[]> => {
    if (!firebaseApp) {
      toast.error('Firebase client not initialized. Cannot upload images.');
      throw new Error('Firebase client not initialized');
    }
    const storageInstance = getStorage(firebaseApp);
    const uploadedUrls: string[] = [];

    const productIdForPath = currentProductId || `temp_product_${Date.now()}`;

    for (const file of files) {
      const imageRef = storageRef(storageInstance, `products/${productIdForPath}/${file.name}`);
      try {
        const snapshot = await uploadBytes(imageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
        toast.success(`Uploaded ${file.name} successfully!`, { duration: 1500 });
      } catch (uploadError: unknown) {
        console.error(`Error uploading ${file.name}:`, uploadError);
        const message = uploadError instanceof Error ? uploadError.message : 'Upload failed.';
        toast.error(`Failed to upload ${file.name}: ${message}`);
        // Decide if one failure should stop all or continue
        // For now, continue and collect successful URLs
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.categoryId?.trim()) { toast.error('Name and Category are required.'); return; }
    setIsSaving(true);

    let finalImageUrls: string[] = [...imageUrlsToKeep];
    let finalProductId = productId; // Used for image path if creating new product

    try {
      // 0. If creating new, generate product ID first for stable image path
      if (!isEditMode) {
        if (firebaseApp) { // Check firebaseApp as firestoreClient depends on it
          const db = getFirestore(firebaseApp); // Get Firestore instance
          finalProductId = doc(collection(db, 'products')).id;
        } else {
          console.warn("Firebase app not available for generating new product ID, image path might be unstable.");
          finalProductId = `temp_product_${Date.now()}`;
        }
      }

      // 1. Upload new images if any
      if (imageFiles.length > 0) {
        const newUrls = await uploadImages(imageFiles, finalProductId); 
        finalImageUrls = [...finalImageUrls, ...newUrls];
      }

      // 2. Prepare data for Firestore
      const productDataPayload = {
        ...formData,
        images: finalImageUrls, // Use the combined list of kept and newly uploaded URLs
      };
      
      // Remove id, createdAt, updatedAt before sending to create/update functions as they are handled by BE or not needed for creation payload
      // For creation, we might want to send the pre-generated ID.
      const { id, createdAt, updatedAt, ...payloadForSubmit } = productDataPayload as Product; 
      
      let finalPayload: ProductCreationData | ProductUpdateData = payloadForSubmit;
      if (!isEditMode && finalProductId) {
        finalPayload = { ...payloadForSubmit, id: finalProductId } as ProductCreationData; // Include ID for creation
      }

      let responseData: CreateProductAdminResponse | UpdateProductAdminResponse;

      if (isEditMode && productId) {
        let result: HttpsCallableResult<UpdateProductAdminResponse>;
        if (updateProductAdminCF) {
          result = await updateProductAdminCF({ productId, updateData: finalPayload as ProductUpdateData });
        } else {
          result = await fallbackUpdateProduct(productId, finalPayload as ProductUpdateData);
        }
        responseData = result.data;
      } else {
        let result: HttpsCallableResult<CreateProductAdminResponse>;
        if (createProductAdminCF) {
          result = await createProductAdminCF(finalPayload as ProductCreationData);
        } else {
          result = await fallbackCreateProduct(finalPayload as ProductCreationData);
        }
        responseData = result.data;
      }

      if (responseData.success) {
        toast.success(`Product ${isEditMode ? 'updated' : 'added'}!`);
        navigate('/admin/products');
      } else { toast.error(responseData.error || 'Save failed.'); }
    } catch (e: unknown) {
      console.error("Error in handleSubmit:", e);
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      toast.error(`Save error: ${message}`); 
    }
    setIsSaving(false);
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading...</div></AdminLayout>;

  return (
    <AdminLayout><div className="container py-10"><form onSubmit={handleSubmit}>
      <Card>
        <CardHeader><CardTitle>{isEditMode ? 'Edit Product' : 'Add Product'}</CardTitle></CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6"> {/* Consider adjusting grid-cols if tabs don't fit */}
              <TabsTrigger value="basic">Basic</TabsTrigger><TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger><TabsTrigger value="inventory">Inventory</TabsTrigger>
              {/* <TabsTrigger value="organization">Organization</TabsTrigger> */}
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div><Label htmlFor="name">Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required /></div>
              <div>
                <Label htmlFor="description">Description</Label>
                {/* Simulated Rich Text Editor Toolbar */}
                <div className="flex items-center space-x-1 border border-input rounded-t-md p-2 bg-muted">
                  <Button type="button" variant="outline" size="sm" className="p-2" onClick={() => toast.info('Bold (Placeholder)')} title="Bold">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="p-2" onClick={() => toast.info('Italic (Placeholder)')} title="Italic">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="p-2" onClick={() => toast.info('Underline (Placeholder)')} title="Underline">
                    <Underline className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description || ''} 
                  onChange={handleInputChange} 
                  className="rounded-t-none min-h-[150px]"
                  placeholder="Enter product description..."
                />
              </div>
              <div><Label htmlFor="categoryId">Category</Label>
                <Select value={formData.categoryId || ''} onValueChange={handleCategoryChange} required>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{availableCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="tags">Tags (comma-separated)</Label><Textarea id="tags" name="tags" value={formData.tags?.join(', ') || ''} onChange={handleTagsChange} placeholder="tag1, tag2, tag3" /></div>
            </TabsContent>
            <TabsContent value="images" className="space-y-4">
              <div>
                <Label htmlFor="imageUpload">Upload New Images</Label>
                <Input id="imageUpload" type="file" multiple accept="image/*" onChange={handleImageFileChange} className="mb-2" />
                {imageFiles.length > 0 && (
                  <div className="mb-4 p-2 border rounded">
                    <h4 className="text-sm font-medium mb-1">New files to upload:</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {imageFiles.map(file => (
                        <li key={file.name} className="flex justify-between items-center">
                          {file.name} ({ (file.size / 1024).toFixed(2) } KB)
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveNewImageFile(file.name)} aria-label="Remove new image"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {imageUrlsToKeep.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Current Images:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {imageUrlsToKeep.map(url => (
                      <div key={url} className="relative group border rounded p-1">
                        <img src={url} alt="Existing product image" className="w-full h-24 object-cover rounded" />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveExistingImage(url)}
                          aria-label="Remove existing image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="pricing" className="space-y-4">
              <div><Label htmlFor="price">Price</Label><Input id="price" name="price" type="number" value={formData.price || 0} onChange={handleNumericChange} /></div>
              <div><Label htmlFor="originalPrice">Original Price</Label><Input id="originalPrice" name="originalPrice" type="number" value={formData.originalPrice || 0} onChange={handleNumericChange} /></div>
            </TabsContent>
            <TabsContent value="inventory" className="space-y-4">
              <div><Label htmlFor="stock">Stock</Label><Input id="stock" name="stock" type="number" value={formData.stock || 0} onChange={handleNumericChange} /></div>
              <div><Label htmlFor="sku">SKU</Label><Input id="sku" name="sku" value={formData.sku || ''} onChange={handleInputChange} /></div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="allowBackorders" 
                  checked={!!formData.allowBackorders} 
                  onCheckedChange={handleToggleChange('allowBackorders' as keyof Product)} 
                />
                <Label htmlFor="allowBackorders">Allow Backorders?</Label>
              </div>
            </TabsContent>
            {/* <TabsContent value="organization" className="space-y-4"> */}
              {/* Add organization-specific fields here */}
            {/* </TabsContent> */}
            <TabsContent value="visibility" className="space-y-2">
              <div className="flex items-center"><Switch id="isEnabled" checked={!!formData.isEnabled} onCheckedChange={handleToggleChange('isEnabled' as keyof Product)} /><Label htmlFor="isEnabled" className="ml-2">Product Enabled</Label></div>
              <div className="flex items-center"><Switch id="featured" checked={!!formData.featured} onCheckedChange={handleToggleChange('featured' as keyof Product)} /><Label htmlFor="featured" className="ml-2">Featured</Label></div>
            </TabsContent>
            <TabsContent value="seo" className="space-y-4">
              <div><Label htmlFor="slug">URL Slug (auto-generated from name if empty)</Label><Input id="slug" name="slug" value={formData.slug || ''} onChange={handleInputChange} /></div>
              <div><Label htmlFor="seoTitle">SEO Title (meta title - defaults to product name if empty)</Label><Input id="seoTitle" name="seoTitle" value={formData.seoTitle || ''} onChange={handleInputChange} /></div>
              <div><Label htmlFor="seoDescription">SEO Description (meta description)</Label><Textarea id="seoDescription" name="seoDescription" value={formData.seoDescription || ''} onChange={handleInputChange} /></div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 py-4"><Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isEditMode ? 'Update' : 'Create'}</Button></CardFooter>
      </Card>
    </form></div></AdminLayout>
  );
};
export default ProductForm;
