// src/pages/Admin/Categories.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layout/AdminLayout';
import { Category, CategoryCreationData, CategoryUpdateData } from '@/services/categoryService'; // Backend types

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// Define callable functions
let getAllCategoriesAdminCF: any;
let createCategoryAdminCF: any;
let updateCategoryAdminCF: any;
let deleteCategoryAdminCF: any;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getAllCategoriesAdminCF = httpsCallable(functionsClient, 'categories-getAllCategoriesCF');
    createCategoryAdminCF = httpsCallable(functionsClient, 'categories-createCategoryCF');
    updateCategoryAdminCF = httpsCallable(functionsClient, 'categories-updateCategoryCF');
    deleteCategoryAdminCF = httpsCallable(functionsClient, 'categories-deleteCategoryCF');
  } catch (error) { console.error("AdminCategories: Error preparing httpsCallable functions:", error); }
}

// Mock for Cloud Function calls
const callCategoryFunctionMock = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING Cloud Function call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'categories-getAllCategoriesCF') {
        return { data: { success: true, categories: [{id: 'cat1', name: 'Electronics', slug:'electronics', isEnabled: true, productCount: 5, parentId: null}, {id: 'cat2', name: 'Laptops', slug:'laptops', isEnabled:true, productCount:3, parentId: 'cat1'}] } };
    }
    if (name === 'categories-createCategoryCF') return { data: { success: true, category: {id: `new_cat_${Date.now()}`, ...payload} } };
    if (name === 'categories-updateCategoryCF') return { data: { success: true, category: {id: payload.categoryId, ...payload.updateData} } };
    if (name === 'categories-deleteCategoryCF') return { data: { success: true, message: 'Category deleted (mock)' } };
    return { data: { success: false, error: 'Unknown mock category function' } };
};

const CategoryForm: React.FC<{
    category?: Partial<Category>;
    onSave: (data: CategoryCreationData | CategoryUpdateData) => Promise<void>;
    onClose: () => void;
    availableCategories: Category[]; // For parent selection, excluding self
    isEditMode: boolean;
}> = ({ category, onSave, onClose, availableCategories, isEditMode }) => {
    const [name, setName] = useState(category?.name || '');
    const [description, setDescription] = useState(category?.description || '');
    const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
    const [parentId, setParentId] = useState(category?.parentId || null);
    const [isEnabled, setIsEnabled] = useState(category?.isEnabled === undefined ? true : category.isEnabled);
    const [isSavingForm, setIsSavingForm] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error("Category name is required."); return; }
        setIsSavingForm(true);
        const data = { name, description, imageUrl, parentId, isEnabled, slug: category?.slug }; // slug is handled by backend for creation, can pass for update
        await onSave(isEditMode && category?.id ? { ...data, name: name } as CategoryUpdateData : data as CategoryCreationData);
        setIsSavingForm(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="cat-name">Name</Label><Input id="cat-name" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><Label htmlFor="cat-desc">Description</Label><Textarea id="cat-desc" value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><Label htmlFor="cat-img">Image URL</Label><Input id="cat-img" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" /></div>
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = getAllCategoriesAdminCF ? await getAllCategoriesAdminCF() : await callCategoryFunctionMock('categories-getAllCategoriesCF');
      if (result.data.success && result.data.categories) {
        setCategories(result.data.categories);
      } else {
        toast.error(result.data.error || 'Failed to load categories');
      }
    } catch (error: any) { toast.error(`Failed to load categories: ${error.message}`); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSaveCategory = async (data: CategoryCreationData | CategoryUpdateData) => {
    try {
      let result;
      if (editingCategory && editingCategory.id) { // Update
        result = updateCategoryAdminCF ? await updateCategoryAdminCF({ categoryId: editingCategory.id, updateData: data as CategoryUpdateData }) : await callCategoryFunctionMock('categories-updateCategoryCF', { categoryId: editingCategory.id, updateData: data });
      } else { // Create
        result = createCategoryAdminCF ? await createCategoryAdminCF(data as CategoryCreationData) : await callCategoryFunctionMock('categories-createCategoryCF', data);
      }
      if (result.data.success) {
        toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
        setIsFormOpen(false); setEditingCategory(null); fetchCategories();
      } else {
        toast.error(result.data.error || 'Failed to save category');
      }
    } catch (error: any) { toast.error(`Error saving category: ${error.message}`); }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete || !deleteCategoryAdminCF) return;
    try {
      const result = await deleteCategoryAdminCF({ categoryId: categoryToDelete.id });
      if ((result as any).data.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      } else {
        toast.error((result as any).data.error || 'Failed to delete category');
      }
    } catch (error: any) { toast.error(`Error deleting category: ${error.message}`); }
    setCategoryToDelete(null);
  };

  const openFormForNew = () => { setEditingCategory(null); setIsFormOpen(true); };
  const openFormForEdit = (category: Category) => { setEditingCategory(category); setIsFormOpen(true); };

  // Recursive function to render categories and their children
  const renderCategories = (cats: Category[], parentId: string | null = null, level = 0) => {
    return cats
      .filter(c => c.parentId === parentId)
      .map(category => (
        <React.Fragment key={category.id}>
          <TableRow>
            <TableCell style={{ paddingLeft: `${level * 20 + 16}px` }}>
              {categories.some(c => c.parentId === category.id) && (
                <ChevronRight size={16} className="inline mr-1" /> // Placeholder for expand/collapse icon
              )}
              {category.name}
            </TableCell>
            <TableCell>{category.slug}</TableCell>
            <TableCell className="text-center">{category.productCount || 0}</TableCell>
            <TableCell className="text-center"><Badge variant={category.isEnabled ? 'default' : 'outline'}>{category.isEnabled ? 'Enabled' : 'Disabled'}</Badge></TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => openFormForEdit(category)}><Edit size={16} className="mr-1"/>Edit</Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setCategoryToDelete(category)}><Trash2 size={16} className="mr-1"/>Delete</Button>
            </TableCell>
          </TableRow>
          {renderCategories(cats, category.id, level + 1)}
        </React.Fragment>
      ));
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading categories...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Categories</CardTitle><CardDescription>Manage product categories and subcategories.</CardDescription></div>
            <Dialog open={isFormOpen} onOpenChange={isOpen => { setIsFormOpen(isOpen); if (!isOpen) setEditingCategory(null); }}>
              <DialogTrigger asChild><Button onClick={openFormForNew}><Plus className="mr-2 h-4 w-4" /> Add Category</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingCategory ? 'Edit' : 'Create'} Category</DialogTitle></DialogHeader>
                <CategoryForm 
                    category={editingCategory || undefined} 
                    onSave={handleSaveCategory} 
                    onClose={() => { setIsFormOpen(false); setEditingCategory(null); }}
                    availableCategories={categories}
                    isEditMode={!!editingCategory}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {categories.length === 0 && !isLoading ? (
                <p className="text-muted-foreground text-center py-4">No categories found. Add one to get started!</p>
            ) : (
                <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {renderCategories(categories)}
                    </tbody>
                </table>
                </div>
            )}
          </CardContent>
        </Card>

        {categoryToDelete && (
          <Dialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Delete Category</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete "{categoryToDelete.name}"? 
                    This action cannot be undone. Make sure no products are assigned to this category.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCategoryToDelete(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteCategory}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
