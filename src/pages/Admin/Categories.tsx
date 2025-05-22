// src/pages/Admin/Categories.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layout/AdminLayout';
import { Category, CategoryCreationData, CategoryUpdateData } from '@/services/categoryService'; 
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// Import Table components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

// Define direct response types for Cloud Functions
interface GetAllCategoriesAdminResponse { success: boolean; categories?: Category[]; error?: string; }
interface CreateCategoryAdminResponse { success: boolean; category?: Category; error?: string; }
interface UpdateCategoryAdminResponse { success: boolean; category?: Category; error?: string; }
interface DeleteCategoryAdminResponse { success: boolean; message?: string; error?: string; }

let getAllCategoriesAdminCF: HttpsCallable<void, GetAllCategoriesAdminResponse> | undefined;
let createCategoryAdminCF: HttpsCallable<CategoryCreationData, CreateCategoryAdminResponse> | undefined;
let updateCategoryAdminCF: HttpsCallable<{ categoryId: string; updateData: CategoryUpdateData }, UpdateCategoryAdminResponse> | undefined;
let deleteCategoryAdminCF: HttpsCallable<{ categoryId: string }, DeleteCategoryAdminResponse> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getAllCategoriesAdminCF = httpsCallable(functionsClient, 'categories-getAllCategoriesCF');
    createCategoryAdminCF = httpsCallable(functionsClient, 'categories-createCategoryCF');
    updateCategoryAdminCF = httpsCallable(functionsClient, 'categories-updateCategoryCF');
    deleteCategoryAdminCF = httpsCallable(functionsClient, 'categories-deleteCategoryCF');
    console.log("AdminCategories: Live httpsCallable references created.");
  } catch (error) { 
    console.error("AdminCategories: Error preparing httpsCallable functions:", error);
    toast.error("Error initializing connection to category service.");
  }
} else {
    console.warn("AdminCategories: Firebase functions client not available. Category operations will be mocked or fail.");
}

// Fallback mock functions if live ones aren't available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fallbackCall = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING FALLBACK Cloud Function call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'getAllCategories') return { data: { success: true, categories: [{id: 'cat1', name: 'Electronics (Mock)', slug:'electronics-mock', isEnabled: true, productCount: 2, parentId: null, createdAt: new Date(), updatedAt: new Date()}] } };
    if (name === 'createCategory') return { data: { success: true, category: {id: `new_mock_${Date.now()}`, ...payload, createdAt: new Date(), updatedAt: new Date()} } };
    if (name === 'updateCategory') return { data: { success: true, category: {id: payload.categoryId, ...payload.updateData, createdAt: new Date(), updatedAt: new Date()} } };
    if (name === 'deleteCategory') return { data: { success: true, message: 'Mock category deleted' } };
    return { data: { success: false, error: 'Unknown mock category function' } };
};

const CategoryForm: React.FC<{
    category?: Partial<Category>;
    onSave: (data: CategoryCreationData | CategoryUpdateData, categoryId?: string) => Promise<void>; // Modified to pass ID for update
    onClose: () => void;
    availableCategories: Category[]; 
    isEditMode: boolean;
}> = ({ category, onSave, onClose, availableCategories, isEditMode }) => {
    const [name, setName] = useState(category?.name || '');
    const [slug, setSlug] = useState(category?.slug || '');
    const [description, setDescription] = useState(category?.description || '');
    const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
    const [parentId, setParentId] = useState(category?.parentId || null);
    const [isEnabled, setIsEnabled] = useState(category?.isEnabled === undefined ? true : category.isEnabled);
    const [seoTitle, setSeoTitle] = useState(category?.seoTitle || '');
    const [seoDescription, setSeoDescription] = useState(category?.seoDescription || '');
    const [isSavingForm, setIsSavingForm] = useState(false);

    // Client-side slug generation helper
    const generateSlug = (value: string): string => {
      if (!value) return '';
      return value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w-]+/g, '')    // Remove all non-word chars
        .replace(/--+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setName(newName);
      if (!slug.trim() || (category?.name === slug)) { // Auto-generate slug if it's empty or was derived from the old name
        setSlug(generateSlug(newName));
      }
    };
    
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlug(e.target.value); // Allow manual override of slug
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error("Category name is required."); return; }
        setIsSavingForm(true);
        const finalSlug = slug.trim() ? slug : generateSlug(name);
        const dataToSave = { 
          name, 
          slug: finalSlug,
          description, 
          imageUrl, 
          parentId: parentId === '' ? null : parentId, 
          isEnabled,
          seoTitle,
          seoDescription 
        };
        
        if (isEditMode && category?.id) {
            await onSave(dataToSave as CategoryUpdateData, category.id);
        } else {
            await onSave(dataToSave as CategoryCreationData);
        }
        setIsSavingForm(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="cat-name">Name</Label><Input id="cat-name" value={name} onChange={handleNameChange} required /></div>
            <div><Label htmlFor="cat-slug">Slug (auto-generated if empty)</Label><Input id="cat-slug" value={slug} onChange={handleSlugChange} placeholder="category-slug" /></div>
            <div><Label htmlFor="cat-desc">Description</Label><Textarea id="cat-desc" value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><Label htmlFor="cat-img">Image URL</Label><Input id="cat-img" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" /></div>
            <div><Label htmlFor="cat-seo-title">SEO Title (optional)</Label><Input id="cat-seo-title" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} /></div>
            <div><Label htmlFor="cat-seo-desc">SEO Description (optional)</Label><Textarea id="cat-seo-desc" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} /></div>
            <div><Label htmlFor="cat-parent">Parent Category</Label>
                <Select value={parentId || ''} onValueChange={(value) => setParentId(value === '' ? null : value)}>
                    <SelectTrigger><SelectValue placeholder="Select parent (optional)" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value=""><em>None (Top Level)</em></SelectItem>
                        {availableCategories.filter(c => c.id !== category?.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2 pt-2"><Switch id="cat-enabled" checked={isEnabled} onCheckedChange={setIsEnabled} /><Label htmlFor="cat-enabled">Enabled</Label></div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSavingForm}>{isSavingForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} {isEditMode ? 'Update' : 'Create'} Category</Button>
            </DialogFooter>
        </form>
    );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const fn = getAllCategoriesAdminCF || (() => fallbackCall('getAllCategories'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: HttpsCallableResult<any> = await fn(); // Explicitly type result
      const responseData = result.data as GetAllCategoriesAdminResponse; // Assert type of data

      if (responseData.success && responseData.categories) setCategories(responseData.categories);
      else { toast.error(responseData.error || 'Failed to load categories'); setCategories([]); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Failed to load categories: ' + e.message); setCategories([]); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSaveCategory = async (data: CategoryCreationData | CategoryUpdateData, categoryIdToUpdate?: string) => {
    try {
      let responseData: CreateCategoryAdminResponse | UpdateCategoryAdminResponse;
      if (categoryIdToUpdate) { // Update
        const fn = updateCategoryAdminCF || ((payload) => fallbackCall('updateCategory', payload));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: HttpsCallableResult<any> = await fn({ categoryId: categoryIdToUpdate, updateData: data as CategoryUpdateData });
        responseData = result.data as UpdateCategoryAdminResponse;
      } else { // Create
        const fn = createCategoryAdminCF || ((payload) => fallbackCall('createCategory', payload));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: HttpsCallableResult<any> = await fn(data as CategoryCreationData);
        responseData = result.data as CreateCategoryAdminResponse;
      }
      if (responseData.success) {
        toast.success(`Category ${categoryIdToUpdate ? 'updated' : 'created'}!`);
        setIsFormOpen(false); setEditingCategory(null); fetchCategories();
      } else { toast.error(responseData.error || 'Save failed.'); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Save error: ' + e.message); }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete || !deleteCategoryAdminCF) { toast.error("Delete function unavailable or no category selected."); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: HttpsCallableResult<any> = await deleteCategoryAdminCF({ categoryId: categoryToDelete.id });
      const responseData = result.data as DeleteCategoryAdminResponse;

      if (responseData.success) {
        toast.success('Category deleted!'); fetchCategories();
      } else { toast.error(responseData.error || 'Delete failed.'); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Delete error: ' + e.message); }
    setCategoryToDelete(null);
  };

  const openFormForNew = () => { setEditingCategory({}); setIsFormOpen(true); };
  const openFormForEdit = (cat: Category) => { setEditingCategory(cat); setIsFormOpen(true); };

  const renderCategories = (cats: Category[], parentId: string | null = null, level = 0) => {
    return cats.filter(c => c.parentId === parentId).map(cat => (
        <React.Fragment key={cat.id}>
          <TableRow>
            <TableCell style={{ paddingLeft: `${level * 20 + 16}px` }}>{cat.name}</TableCell>
            <TableCell>{cat.slug}</TableCell>
            <TableCell className="text-center"><Badge variant={cat.isEnabled ? 'default' : 'outline'}>{cat.isEnabled ? 'Active' : 'Disabled'}</Badge></TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => openFormForEdit(cat)} aria-label="Edit category"><Edit size={16}/></Button>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setCategoryToDelete(cat)} aria-label="Delete category"><Trash2 size={16}/></Button>
            </TableCell>
          </TableRow>
          {renderCategories(cats, cat.id, level + 1)}
        </React.Fragment>
      ));
  };
  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/></div></AdminLayout>;

  return (
    <AdminLayout><div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Categories</CardTitle><CardDescription>Manage product categories.</CardDescription></div>
          <Dialog open={isFormOpen} onOpenChange={isOpen => { setIsFormOpen(isOpen); if (!isOpen) setEditingCategory(null); }}>
            <DialogTrigger asChild><Button onClick={openFormForNew}><Plus className="mr-2 h-4 w-4"/>Add Category</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCategory && editingCategory.id ? 'Edit' : 'Create'} Category</DialogTitle></DialogHeader>
              <CategoryForm category={editingCategory || {}} onSave={handleSaveCategory} onClose={() => setIsFormOpen(false)} availableCategories={categories} isEditMode={!!(editingCategory && editingCategory.id)}/>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {categories.length === 0 && !isLoading ? <p>No categories found.</p> : (
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{renderCategories(categories)}</TableBody></Table>)}
        </CardContent>
      </Card>
      {categoryToDelete && <Dialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Category</DialogTitle><DialogDescription>Delete "{categoryToDelete.name}"? Products in this category may need to be reassigned.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setCategoryToDelete(null)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteCategory}>Delete</Button></DialogFooter>
        </DialogContent></Dialog>}
    </div></AdminLayout>
  );
};
export default AdminCategories;
