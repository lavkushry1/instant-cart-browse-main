import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Search, Filter, Edit, Trash2, Eye, ArrowUpDown, X, Loader2 } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layout/AdminLayout';
import { Product } from '@/services/productService'; // Backend type

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { GetAllProductsOptionsBE } from '@/services/productService'; 

// Define callable functions
let getAllProductsAdminCF: HttpsCallable<GetAllProductsOptionsBE | undefined, HttpsCallableResult<{ success: boolean; products?: Product[]; totalCount?: number; error?: string }>> | undefined;
let deleteProductAdminCF: HttpsCallable<{ productId: string }, HttpsCallableResult<{ success: boolean; message?: string; error?: string }>> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    // Assuming functions are exported as products.getAllProductsCF and products.deleteProductCF
    // The name for httpsCallable is typically 'groupName-functionName' or just 'functionName' if not grouped in index.ts
    getAllProductsAdminCF = httpsCallable(functionsClient, 'products-getAllProductsCF'); 
    deleteProductAdminCF = httpsCallable(functionsClient, 'products-deleteProductCF');
    console.log("AdminProducts: Live httpsCallable references created.");
  } catch (error) {
    console.error("AdminProducts: Error preparing httpsCallable functions:", error);
    toast.error("Error initializing connection to product service.");
  }
} else {
    console.warn("AdminProducts: Firebase functions client not available. Product operations will be mocked or fail.");
}

// Fallback mock if live function is not available
const callGetAllProductsCFMock = async (options?: GetAllProductsOptionsBE): Promise<HttpsCallableResult<{ success: boolean, products?: Product[], totalCount?: number, error?: string }>> => {
    console.warn("MOCK callGetAllProductsCF with options:", options);
    await new Promise(r => setTimeout(r, 500));
    const mockProducts: Product[] = [
        { id: '1', name: 'Mock Laptop Pro', categoryId: 'electronics', categoryName: 'Electronics', price: 1200, stock: 15, isEnabled: true, images:['/placeholder.svg'], description:'', createdAt: new Date(), updatedAt: new Date(), tags:['mock'], featured: false },
        { id: '2', name: 'Mock T-Shirt Fun', categoryId: 'clothing', categoryName: 'Clothing', price: 25, stock: 100, isEnabled: true, images:['/placeholder.svg'], description:'', createdAt: new Date(), updatedAt: new Date(), tags:['mock'], featured: true },
    ];
    return { data: { success: true, products: mockProducts, totalCount: mockProducts.length } };
};

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Product | string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: GetAllProductsOptionsBE = { isEnabled: undefined /* Fetch all */, sortBy: 'createdAt', sortOrder: 'desc' };
      const result = getAllProductsAdminCF 
        ? await getAllProductsAdminCF(options) 
        : await callGetAllProductsCFMock(options);

      if (result.data.success && result.data.products) {
        setProducts(result.data.products.map(p => ({...p, category: p.categoryName || p.categoryId } as Product)));
      } else {
        toast.error(result.data.error || 'Failed to load products');
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(`Failed to load products: ${error.message || 'Unknown error'}`);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const sortedAndFilteredProducts = useMemo(() => {
    let items = [...products];
    if (searchQuery.trim() !== '') {
      const lcQuery = searchQuery.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(lcQuery) || 
        (p.categoryName || p.categoryId).toLowerCase().includes(lcQuery) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lcQuery)))
      );
    }
    items.sort((a, b) => {
        const aVal = (a as any)[sortField];
        const bVal = (b as any)[sortField];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === 'asc' 
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });
    return items;
  }, [products, searchQuery, sortField, sortDirection]);

  const handleSort = (field: keyof Product | string) => {
    if (field === sortField) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleDeleteClick = (product: Product) => { setProductToDelete(product); setDeleteDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    if (!deleteProductAdminCF) { toast.error("Delete function not available."); return; }
    try {
      const result = await deleteProductAdminCF({ productId: productToDelete.id });
      if (result.data.success) {
        setProducts(prev => prev.filter(p => p.id !== productToDelete!.id));
        toast.success('Product deleted successfully');
      } else {
        toast.error(result.data.error || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(`Failed to delete product: ${error.message || 'Unknown error'}`);
    }
    setDeleteDialogOpen(false); setProductToDelete(null);
  };

  const handleAddNew = () => navigate('/admin/products/new');
  const handleEdit = (productId: string) => navigate(`/admin/products/edit/${productId}`);
  const handleView = (productId: string) => navigate(`/product/${productId}`);

  return (
    <AdminLayout>
      <div className="container py-10">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-2xl font-bold">Products</CardTitle><CardDescription>Manage product inventory</CardDescription></div>
            <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" />Add Product</Button>
          </CardHeader>
          <CardContent>
            <div className="mb-6"><Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
            {isLoading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : 
             sortedAndFilteredProducts.length === 0 ? <p className="text-center py-4 text-muted-foreground">No products found.</p> : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-12"><span className="sr-only">Img</span></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('name')}>Name {sortField === 'name' && <ArrowUpDown className="ml-1 h-3 w-3 inline"/>}</Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('categoryName')}>Category {sortField === 'categoryName' && <ArrowUpDown className="ml-1 h-3 w-3 inline"/>}</Button></TableHead>
                    <TableHead className="text-right"><Button variant="ghost" onClick={() => handleSort('price')}>Price {sortField === 'price' && <ArrowUpDown className="ml-1 h-3 w-3 inline"/>}</Button></TableHead>
                    <TableHead className="text-right"><Button variant="ghost" onClick={() => handleSort('stock')}>Stock {sortField === 'stock' && <ArrowUpDown className="ml-1 h-3 w-3 inline"/>}</Button></TableHead>
                    <TableHead className="text-center">Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{sortedAndFilteredProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><img src={p.images[0] || '/placeholder.svg'} alt={p.name} className="h-10 w-10 object-cover rounded"/></TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.categoryName || p.categoryId}</TableCell>
                      <TableCell className="text-right">${p.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                      <TableCell className="text-center"><Badge variant={p.isEnabled ? (p.stock > 0 ? 'default' : 'destructive') : 'outline'}>{p.isEnabled ? (p.stock > 0 ? 'In Stock' : 'Out of Stock') : 'Disabled'}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(p.id)}><Eye size={16}/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p.id)}><Edit size={16}/></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteClick(p)}><Trash2 size={16}/></Button>
                      </TableCell>
                    </TableRow>))}
                  </TableBody>
                </Table>
              </div>)}
          </CardContent>
        </Card>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Product</DialogTitle><DialogDescription>Delete "{productToDelete?.name}"?</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
export default AdminProducts;
