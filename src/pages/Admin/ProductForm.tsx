import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Plus, Upload, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, ProductCreationData, ProductUpdateData } from '@/services/productService'; 
import { Category } from '@/services/categoryService'; 
import AdminLayout from '@/components/layout/AdminLayout';

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

let createProductAdminCF: HttpsCallable<ProductCreationData, HttpsCallableResult<{ success: boolean; product?: Product; error?: string }>> | undefined;
let getProductByIdAdminCF: HttpsCallable<{ productId: string }, HttpsCallableResult<{ success: boolean; product?: Product; error?: string }>> | undefined;
let updateProductAdminCF: HttpsCallable<{ productId: string; updateData: ProductUpdateData }, HttpsCallableResult<{ success: boolean; product?: Product; error?: string }>> | undefined;
let getAllCategoriesAdminCF: HttpsCallable<void, HttpsCallableResult<{ success: boolean; categories?: Category[]; error?: string }>> | undefined;

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
    if (productId === 'existing_id') return { data: { success: true, product: { id: 'existing_id', name: 'Fetched Mock Product', description: 'Desc', price: 99, categoryId: 'cat1', stock: 10, images:['/placeholder.svg'], tags:['test'], isEnabled: true, featured: false, createdAt: new Date(), updatedAt: new Date() } as Product } };
    return { data: { success: false, error: 'Mock Product not found' } };
};
const fallbackGetAllCategories = async (): Promise<HttpsCallableResult<{success: boolean; categories?: Category[]; error?: string}>> => {
    console.warn("MOCK getAllCategoriesCF");
    return { data: { success: true, categories: [{id: 'cat1', name: 'Electronics', slug:'', isEnabled:true, createdAt: new Date(), updatedAt: new Date()}, {id: 'cat2', name: 'Books', slug:'', isEnabled:true, createdAt: new Date(), updatedAt: new Date()}] } };
};
const fallbackCreateProduct = async (data: ProductCreationData): Promise<HttpsCallableResult<{success: boolean; product?: Product; error?: string}>> => {
    console.warn("MOCK createProductCF", data);
    return { data: { success: true, product: {id: `new_mock_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date()} as Product } };
};
const fallbackUpdateProduct = async (productId: string, data: ProductUpdateData): Promise<HttpsCallableResult<{success: boolean; product?: Product; error?: string}>> => {
    console.warn("MOCK updateProductCF", productId, data);
    return { data: { success: true, product: {id: productId, ...data, name: data.name || "Updated Mock", price: data.price || 0, categoryId: data.categoryId || "mockCat", stock: data.stock || 0, images: data.images || [], isEnabled: data.isEnabled === undefined ? true : data.isEnabled, createdAt: new Date(), updatedAt: new Date() } as Product } };
};


const emptyProductForm: ProductCreationData = {
  name: '', description: '', price: 0, categoryId: '', stock: 0, images: [], tags: [], isEnabled: true, featured: false, sku: '', originalPrice: 0, variations: [], attributes: {}
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
  // Simplified states for brevity for this step

  const fetchProductAndDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      const catFn = getAllCategoriesAdminCF || fallbackGetAllCategories;
      const catResult = await catFn();
      if (catResult.data.success && catResult.data.categories) setAvailableCategories(catResult.data.categories);
      else toast.error(catResult.data.error || 'Failed to load categories');

      if (isEditMode && productId) {
        const prodFn = getProductByIdAdminCF || fallbackGetProductById;
        const prodResult = await prodFn({ productId });
        if (prodResult.data.success && prodResult.data.product) setFormData(prodResult.data.product);
        else { toast.error(prodResult.data.error || 'Failed to load product'); navigate('/admin/products'); }
      } else {
        setFormData(emptyProductForm);
      }
    } catch (e:any) { toast.error(`Init error: ${e.message}`); navigate('/admin/products'); }
    setIsLoading(false);
  }, [productId, isEditMode, navigate]);

  useEffect(() => { fetchProductAndDependencies(); }, [fetchProductAndDependencies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  const handleCategoryChange = (value: string) => setFormData(prev => ({ ...prev, categoryId: value }));
  const handleToggleChange = (field: keyof Product) => (checked: boolean) => setFormData(prev => ({ ...prev, [field]: checked }));
  const handleImagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({...prev, images: e.target.value.split(',').map(s=>s.trim()).filter(s=>s)}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.categoryId?.trim()) { toast.error('Name and Category are required.'); return; }
    setIsSaving(true);
    try {
      let result: HttpsCallableResult<any>;
      if (isEditMode && productId) {
        const { id, createdAt, updatedAt, ...updateData } = formData as Product;
        const updateFn = updateProductAdminCF || ((payload) => fallbackUpdateProduct(productId, payload.updateData));
        result = await updateFn({ productId, updateData: updateData as ProductUpdateData });
      } else {
        const createFn = createProductAdminCF || fallbackCreateProduct;
        result = await createFn(formData as ProductCreationData);
      }
      if (result.data.success) {
        toast.success(`Product ${isEditMode ? 'updated' : 'added'}!`);
        navigate('/admin/products');
      } else { toast.error(result.data.error || 'Save failed.'); }
    } catch (e:any) { toast.error(`Save error: ${e.message}`); }
    setIsSaving(false);
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading...</div></AdminLayout>;

  return (
    <AdminLayout><div className="container py-10"><form onSubmit={handleSubmit}>
      <Card>
        <CardHeader><CardTitle>{isEditMode ? 'Edit Product' : 'Add Product'}</CardTitle></CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic">Basic</TabsTrigger><TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger><TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div><Label htmlFor="name">Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required /></div>
              <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} /></div>
              <div><Label htmlFor="categoryId">Category</Label>
                <Select value={formData.categoryId || ''} onValueChange={handleCategoryChange} required>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{availableCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center"><Switch id="isEnabled" checked={!!formData.isEnabled} onCheckedChange={handleToggleChange('isEnabled' as keyof Product)} /><Label htmlFor="isEnabled" className="ml-2">Enabled</Label></div>
              <div className="flex items-center"><Switch id="featured" checked={!!formData.featured} onCheckedChange={handleToggleChange('featured' as keyof Product)} /><Label htmlFor="featured" className="ml-2">Featured</Label></div>
            </TabsContent>
            <TabsContent value="images"><Label>Images (URLs, comma-sep)</Label><Textarea value={formData.images?.join(', ') || ''} onChange={handleImagesChange} placeholder="url1, url2" /></TabsContent>
            <TabsContent value="pricing"><Label htmlFor="price">Price</Label><Input id="price" name="price" type="number" value={formData.price || 0} onChange={handleNumericChange} /></TabsContent>
            <TabsContent value="inventory"><Label htmlFor="stock">Stock</Label><Input id="stock" name="stock" type="number" value={formData.stock || 0} onChange={handleNumericChange} /></TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 py-4"><Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isEditMode ? 'Update' : 'Create'}</Button></CardFooter>
      </Card>
    </form></div></AdminLayout>
  );
};
export default ProductForm;
