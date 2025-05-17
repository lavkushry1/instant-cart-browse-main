// src/pages/Admin/Reviews.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/layout/AdminLayout';
import { ProductReviewBE, ReviewUpdateData, GetReviewsAdminOptionsBE } from '@/services/reviewService';

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

let getReviewsAdminCF: HttpsCallable<GetReviewsAdminOptionsBE | undefined, HttpsCallableResult<{ success: boolean; reviews?: ProductReviewBE[]; totalCount?: number; error?: string }>> | undefined;
let updateReviewAdminCF: HttpsCallable<{ productId: string; reviewId: string; updateData: ReviewUpdateData }, HttpsCallableResult<{ success: boolean; review?: ProductReviewBE; error?: string }>> | undefined;
let deleteReviewAdminCF: HttpsCallable<{ productId: string; reviewId: string }, HttpsCallableResult<{ success: boolean; message?: string; error?: string }>> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getReviewsAdminCF = httpsCallable(functionsClient, 'reviews-getReviewsAdminCF');
    updateReviewAdminCF = httpsCallable(functionsClient, 'reviews-updateReviewCF');
    deleteReviewAdminCF = httpsCallable(functionsClient, 'reviews-deleteReviewCF');
    console.log("AdminReviews: Live httpsCallable references created.");
  } catch (error) { 
    console.error("AdminReviews: Error preparing httpsCallable:", error);
    toast.error("Error initializing connection to review service.");
  }
} else {
    console.warn("AdminReviews: Firebase functions client not available. Operations will use mocks or fail.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fallbackReviewCall = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING Review CF call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'reviews-getReviewsAdminCF') {
        return { data: { success: true, reviews: [
            { id: 'rev1', productId: 'prod1', productName: 'Laptop Pro (Mock)', userId: 'userA', reviewerName: 'Alice', rating: 5, comment: 'Great laptop!', createdAt: new Date().toISOString(), approved: true },
            { id: 'rev2', productId: 'prod2', productName: 'Wireless Mouse (Mock)', userId: 'userB', reviewerName: 'Bob', rating: 3, comment: 'Okay, but disconnects.', createdAt: new Date(Date.now()-86400000).toISOString(), approved: false },
        ], totalCount: 2 } };
    }
    if (name === 'reviews-updateReviewCF') return { data: { success: true, review: { ...payload.updateData, id: payload.reviewId, productId: payload.productId } } };
    if (name === 'reviews-deleteReviewCF') return { data: { success: true, message: 'Review deleted (mock)' } };
    return { data: { success: false, error: 'Unknown mock review function' } };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDate = (dateInput: any): string => new Date(dateInput?.toDate ? dateInput.toDate() : dateInput).toLocaleDateString();

const AdminReviews = () => {
  const [reviews, setReviews] = useState<ProductReviewBE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [reviewToDelete, setReviewToDelete] = useState<ProductReviewBE | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    const options: GetReviewsAdminOptionsBE = { sortBy: 'createdAt', sortOrder: 'desc' };
    if (filterStatus === 'approved') options.approved = true;
    else if (filterStatus === 'pending') options.approved = false;
    // else if filterStatus is 'all', options.approved remains undefined, fetching all.

    try {
      const fn = getReviewsAdminCF || ((opts?: GetReviewsAdminOptionsBE) => fallbackReviewCall('reviews-getReviewsAdminCF', opts));
      const result = await fn(options);
      if (result.data.success && result.data.reviews) {
        setReviews(result.data.reviews);
      } else { toast.error(result.data.error || 'Failed to load reviews'); setReviews([]); }
    } catch (e: unknown) { 
      let message = 'Unknown error';
      if (e instanceof Error) {
        message = e.message;
      }
      toast.error('Failed to load reviews: ' + message); 
      setReviews([]); 
    }
    setIsLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApproveReview = async (review: ProductReviewBE) => {
    setIsProcessingAction(true);
    const fn = updateReviewAdminCF || ((payload) => fallbackReviewCall('reviews-updateReviewCF', payload));
    try {
      const result = await fn({ productId: review.productId, reviewId: review.id, updateData: { approved: true } });
      if (result.data.success) { toast.success('Review approved!'); fetchReviews(); }
      else { toast.error(result.data.error || 'Failed to approve review.'); }
    } catch (e: unknown) { 
      let message = 'Unknown error';
      if (e instanceof Error) {
        message = e.message;
      }
      toast.error('Error approving review: ' + message); 
    }
    setIsProcessingAction(false);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    setIsProcessingAction(true);
    const fn = deleteReviewAdminCF || ((payload) => fallbackReviewCall('reviews-deleteReviewCF', payload));
    try {
      const result = await fn({ productId: reviewToDelete.productId, reviewId: reviewToDelete.id });
      if (result.data.success) { toast.success('Review deleted/rejected!'); fetchReviews(); }
      else { toast.error(result.data.error || 'Failed to delete review.'); }
    } catch (e: unknown) { 
      let message = 'Unknown error';
      if (e instanceof Error) {
        message = e.message;
      }
      toast.error('Error deleting review: ' + message); 
    }
    setReviewToDelete(null);
    setIsProcessingAction(false);
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading reviews...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Review Moderation</CardTitle><CardDescription>Approve or reject customer reviews.</CardDescription></CardHeader>
          <CardContent>
            <div className="mb-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as any)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reviews.length === 0 && !isLoading ? <p className="text-muted-foreground text-center py-4">No reviews match this filter.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>User</TableHead><TableHead>Rating</TableHead><TableHead>Comment</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{reviews.map(review => (
                    <TableRow key={review.id}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <TableCell>{(review as any).productName || review.productId.substring(0,10)+'...'}</TableCell>
                      <TableCell>{review.reviewerName || review.userId.substring(0,10)+'...'}</TableCell>
                      <TableCell>{Array(review.rating).fill('⭐').join('')}</TableCell>
                      <TableCell className="max-w-xs truncate" title={review.comment}>{review.comment}</TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell><Badge variant={review.approved ? 'default' : 'secondary'}>{review.approved ? 'Approved' : 'Pending'}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        {!review.approved && <Button size="sm" variant="outline" onClick={() => handleApproveReview(review)} disabled={isProcessingAction}>{isProcessingAction && <Loader2 className="mr-1 h-3 w-3 animate-spin"/>}Approve</Button>}
                        <Button size="sm" variant="destructive" onClick={() => setReviewToDelete(review)} disabled={isProcessingAction}>{isProcessingAction && <Loader2 className="mr-1 h-3 w-3 animate-spin"/>}Reject</Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>)}
          </CardContent>
        </Card>
        {reviewToDelete && <Dialog open={!!reviewToDelete} onOpenChange={() => setReviewToDelete(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm Reject/Delete Review</DialogTitle><DialogDescription>Delete review: "{reviewToDelete.comment?.substring(0,50)}..."?</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewToDelete(null)} disabled={isProcessingAction}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteReview} disabled={isProcessingAction}>{isProcessingAction && <Loader2 className="mr-1 h-3 w-3 animate-spin"/>}Delete</Button>
            </DialogFooter>
          </DialogContent></Dialog>}
      </div>
    </AdminLayout>
  );
};
export default AdminReviews;
