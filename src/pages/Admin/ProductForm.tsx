import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Plus, Upload, Trash2, Save, Loader2, AlertCircle } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, ProductCreationData, ProductUpdateData } from '@/services/productService'; // Backend types
import { Category } from '@/services/categoryService'; // Backend type for Category
import AdminLayout from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// Define callable functions (adjust names based on actual deployed/exported names)
let createProductAdminCF: any;
let getProductByIdAdminCF: any; // Using Admin suffix if it has specific logic or just for clarity
let updateProductAdminCF: any;
let getAllCategoriesAdminCF: any; // Assuming an admin version or a public one is fine

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    createProductAdminCF = httpsCallable(functionsClient, 'products-createProductCF');
    getProductByIdAdminCF = httpsCallable(functionsClient, 'products-getProductByIdCF'); // This might be an HTTP GET in reality
    updateProductAdminCF = httpsCallable(functionsClient, 'products-updateProductCF');
    getAllCategoriesAdminCF = httpsCallable(functionsClient, 'categories-getAllCategoriesCF'); // Example path
  } catch (error) {
    console.error("ProductForm: Error preparing httpsCallable functions:", error);
  }
}

// Mocks for functions not yet fully integrated or for fallback
const callProductFunctionMock = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING Cloud Function call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'products-getProductByIdCF' && payload?.productId) {
        if (payload.productId === 'existing_id') return { data: { success: true, product: { id: 'existing_id', name: 'Fetched Mock Product', description: 'Desc', price: 99, categoryId: 'cat1', stock: 10, images:['/placeholder.svg'], tags:['test'], isEnabled: true, featured: false } } };
        return { data: { success: false, error: 'Mock Product not found' } };
    }
    if (name === 'categories-getAllCategoriesCF') {
        return { data: { success: true, categories: [{id: 'cat1', name: 'Electronics'}, {id: 'cat2', name: 'Books'}] } };
    }
    if (name === 'products-createProductCF' || name === 'products-updateProductCF'){
        return { data: { success: true, product: {id: payload?.productId || 'new_mock_id', ...payload?.productData || payload } } };
    }
    return { data: { success: false, error: 'Unknown mock product function' } };
};

const emptyProductForm: ProductCreationData = {
  name: '', description: '', price: 0, categoryId: '', stock: 0, images: [], tags: [], isEnabled: true, featured: false
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
  const [availableTags, setAvailableTags] = useState<string[]>([]); // Assuming tags are simple strings for now
  const [newTag, setNewTag] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  // SEO States and handlers would be similar, omitted for brevity in this step focusing on core CRUD

  const fetchProductAndDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Categories
      const catResult = getAllCategoriesAdminCF 
        ? await getAllCategoriesAdminCF() 
        : await callProductFunctionMock('categories-getAllCategoriesCF');
      if (catResult.data.success && catResult.data.categories) {
        setAvailableCategories(catResult.data.categories);
      } else {
        toast.error(catResult.data.error || 'Failed to load categories');
      }
      // TODO: Fetch existing tags similarly if managed centrally

      if (isEditMode && productId) {
        const prodResult = getProductByIdAdminCF 
          ? await getProductByIdAdminCF({ productId }) 
          : await callProductFunctionMock('products-getProductByIdCF', { productId });
        if (prodResult.data.success && prodResult.data.product) {
          setFormData(prodResult.data.product);
        } else {
          toast.error(prodResult.data.error || 'Failed to load product data');
          navigate('/admin/products');
        }
      } else {
        setFormData(emptyProductForm);
      }
    } catch (error: any) {
      toast.error(`Error initializing form: ${error.message}`);
      navigate('/admin/products');
    } finally {
      setIsLoading(false);
    }
  }, [productId, isEditMode, navigate]);

  useEffect(() => {
    fetchProductAndDependencies();
  }, [fetchProductAndDependencies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  const handleCategoryChange = (value: string) => setFormData(prev => ({ ...prev, categoryId: value }));
  const handleToggleChange = (field: keyof Product) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };
  const handleAddTag = () => { /* ... */ };
  const handleRemoveTag = (tag: string) => { /* ... */ };
  const handleAddImage = () => { /* ... */ };
  const handleRemoveImage = (img: string) => { /* ... */ };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.categoryId?.trim() || formData.images?.length === 0) {
      toast.error('Name, Category, and at least one Image are required.');
      return;
    }
    setIsSaving(true);
    try {
      let result: HttpsCallableResult<any>;
      if (isEditMode && productId) {
        const { id, createdAt, updatedAt, ...updateData } = formData as Product;
        result = updateProductAdminCF 
          ? await updateProductAdminCF({ productId, updateData: updateData as ProductUpdateData }) 
          : await callProductFunctionMock('products-updateProductCF', { productId, updateData });
      } else {
        result = createProductAdminCF 
          ? await createProductAdminCF(formData as ProductCreationData) 
          : await callProductFunctionMock('products-createProductCF', formData);
      }

      if (result.data.success) {
        toast.success(`Product ${isEditMode ? 'updated' : 'added'} successfully!`);
        navigate('/admin/products');
      } else {
        toast.error(result.data.error || `Failed to ${isEditMode ? 'update' : 'add'} product.`);
      }
    } catch (error: any) {
      toast.error(`Error saving product: ${error.message}`);
    }
    setIsSaving(false);
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="container py-10">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</CardTitle></CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  {/* <TabsTrigger value="seo">SEO</TabsTrigger> */}
                </TabsList>
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required /></div>
                  <div className="space-y-1"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} /></div>
                  <div className="space-y-1"><Label htmlFor="categoryId">Category</Label>
                    <Select value={formData.categoryId || ''} onValueChange={handleCategoryChange} required>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{availableCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {/* Tags Input - similar structure, simplified for now */}
                  <div className="flex items-center space-x-2 pt-2"><Switch id="isEnabled" checked={formData.isEnabled || false} onCheckedChange={handleToggleChange('isEnabled' as keyof Product)} /><Label htmlFor="isEnabled">Enabled (Visible in store)</Label></div>
                  <div className="flex items-center space-x-2 pt-2"><Switch id="featured" checked={formData.featured || false} onCheckedChange={handleToggleChange('featured' as keyof Product)} /><Label htmlFor="featured">Featured Product</Label></div>
                </TabsContent>
                <TabsContent value="images" className="space-y-4">
                    {/* ... Image management UI ... */}
                    <div className="space-y-1"><Label>Images (URLs, comma-separated for mock)</Label><Textarea value={formData.images?.join(', ') || ''} onChange={e => setFormData(prev => ({...prev, images: e.target.value.split(',').map(s=>s.trim()).filter(s=>s)}))} /></div>
                </TabsContent>
                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label htmlFor="price">Price</Label><Input id="price" name="price" type="number" value={formData.price || 0} onChange={handleNumericChange} /></div>
                    {/* Add originalPrice if needed */}
                  </div>
                </TabsContent>
                <TabsContent value="inventory" className="space-y-4">
                  <div className="space-y-1"><Label htmlFor="stock">Stock</Label><Input id="stock" name="stock" type="number" value={formData.stock || 0} onChange={handleNumericChange} /></div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 py-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isEditMode ? 'Update' : 'Create'} Product</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductForm;
