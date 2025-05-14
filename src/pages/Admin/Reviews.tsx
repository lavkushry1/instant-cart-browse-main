// src/pages/Admin/Reviews.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { ThumbsUp, ThumbsDown, Trash2, CheckCircle, XCircle, Filter, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/layout/AdminLayout';
import { ProductReviewBE, ReviewUpdateData, GetReviewsAdminOptionsBE } from '@/services/reviewService';

// Firebase Client SDK imports
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable } from 'firebase/functions';

let getReviewsAdminCF: any;
let updateReviewAdminCF: any; // Assumes updateReviewCF can be used by admin
let deleteReviewAdminCF: any; // Assumes deleteReviewCF can be used by admin

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getReviewsAdminCF = httpsCallable(functionsClient, 'reviews-getReviewsAdminCF');
    updateReviewAdminCF = httpsCallable(functionsClient, 'reviews-updateReviewCF');
    deleteReviewAdminCF = httpsCallable(functionsClient, 'reviews-deleteReviewCF');
  } catch (error) { console.error("AdminReviews: Error preparing httpsCallable:", error); }
}

const callReviewFunctionMock = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING Review CF call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'reviews-getReviewsAdminCF') {
        return { data: { success: true, reviews: [
            { id: 'rev1', productId: 'prod1', productName: 'Laptop Pro', userId: 'userA', reviewerName: 'Alice', rating: 5, comment: 'Great laptop!', createdAt: new Date().toISOString(), approved: true },
            { id: 'rev2', productId: 'prod2', productName: 'Wireless Mouse', userId: 'userB', reviewerName: 'Bob', rating: 3, comment: 'Okay, but disconnects sometimes.', createdAt: new Date(Date.now()-86400000).toISOString(), approved: false },
            { id: 'rev3', productId: 'prod1', productName: 'Laptop Pro', userId: 'userC', reviewerName: 'Charlie', rating: 4, comment: 'Good value.', createdAt: new Date(Date.now()-172800000).toISOString(), approved: true },
        ], totalCount: 3 } };
    }
    if (name === 'reviews-updateReviewCF') return { data: { success: true, review: { ...payload.updateData, id: payload.reviewId, productId: payload.productId } } };
    if (name === 'reviews-deleteReviewCF') return { data: { success: true, message: 'Review deleted (mock)' } };
    return { data: { success: false, error: 'Unknown mock review function' } };
};

const formatDate = (dateInput: any) => new Date(dateInput?.toDate ? dateInput.toDate() : dateInput).toLocaleDateString();

const AdminReviews = () => {
  const [reviews, setReviews] = useState<ProductReviewBE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [reviewToDelete, setReviewToDelete] = useState<ProductReviewBE | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    let options: GetReviewsAdminOptionsBE = { sortBy: 'createdAt', sortOrder: 'desc' };
    if (filterStatus === 'approved') options.approved = true;
    if (filterStatus === 'pending') options.approved = false;

    try {
      const result = getReviewsAdminCF ? await getReviewsAdminCF(options) : await callReviewFunctionMock('reviews-getReviewsAdminCF', options);
      if (result.data.success && result.data.reviews) {
        setReviews(result.data.reviews);
      } else { toast.error(result.data.error || 'Failed to load reviews'); }
    } catch (e:any) { toast.error(\`Failed to load reviews: ${e.message}\`); }
    setIsLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApproveReview = async (review: ProductReviewBE) => {
    if (!updateReviewAdminCF) { toast.error("Function not ready."); return; }
    try {
      const result = await updateReviewAdminCF({ productId: review.productId, reviewId: review.id, updateData: { approved: true } });
      if (result.data.success) {
        toast.success('Review approved!'); fetchReviews();
      } else { toast.error(result.data.error || 'Failed to approve review.'); }
    } catch (e:any) { toast.error(\`Error approving review: ${e.message}\`); }
  };

  const handleRejectReview = async (review: ProductReviewBE) => { // Reject = Delete for now
    setReviewToDelete(review);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete || !deleteReviewAdminCF) { toast.error("Function not ready or review not selected."); return; }
    try {
      const result = await deleteReviewAdminCF({ productId: reviewToDelete.productId, reviewId: reviewToDelete.id });
      if (result.data.success) {
        toast.success('Review deleted/rejected!'); fetchReviews();
      } else { toast.error(result.data.error || 'Failed to delete review.'); }
    } catch (e:any) { toast.error(\`Error deleting review: ${e.message}\`); }
    setReviewToDelete(null);
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading reviews...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Review Moderation</CardTitle><CardDescription>Approve or reject customer reviews.</CardDescription></CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as any)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reviews.length === 0 ? <p>No reviews match this filter.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>User</TableHead><TableHead>Rating</TableHead><TableHead>Comment</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reviews.map(review => (
                    <TableRow key={review.id}>
                      <TableCell>{(review as any).productName || review.productId}</TableCell>
                      <TableCell>{review.reviewerName || review.userId}</TableCell>
                      <TableCell>{Array(review.rating).fill('⭐').join('')}</TableCell>
                      <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell><Badge variant={review.approved ? 'default' : 'secondary'}>{review.approved ? 'Approved' : 'Pending'}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        {!review.approved && <Button size="sm" variant="outline" onClick={() => handleApproveReview(review)}><CheckCircle size={16} className="mr-1"/>Approve</Button>}
                        <Button size="sm" variant="destructive" onClick={() => handleRejectReview(review)}><XCircle size={16} className="mr-1"/>Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {reviewToDelete && (
          <Dialog open={!!reviewToDelete} onOpenChange={() => setReviewToDelete(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Confirm Reject/Delete Review</DialogTitle>
                <DialogDescription>Are you sure you want to delete this review? This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReviewToDelete(null)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDeleteReview}>Delete Review</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
