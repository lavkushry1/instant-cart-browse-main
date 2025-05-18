import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ThumbsUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { functionsClient } from '../lib/firebaseClient';
import { httpsCallable, HttpsCallable } from 'firebase/functions';
import { ProductReview as BEProductReview } from '../services/productService';
import { Timestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  userVoted?: boolean;
}

interface GetProductReviewsCFResponse {
  success: boolean;
  reviews?: BEProductReview[];
  error?: string;
}

interface AddReviewCFData {
  productId: string;
  rating: number;
  comment?: string;
}

interface AddReviewCFResponse {
  success: boolean;
  review?: BEProductReview;
  error?: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews = ({ productId, productName }: ProductReviewsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userReview, setUserReview] = useState({
    rating: 0,
    title: '',
    comment: ''
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firebase Callables
  let getProductReviewsCallable: HttpsCallable<{ productId: string; limit?: number; /* TODO: startAfter support */ }, GetProductReviewsCFResponse> | undefined;
  let addReviewCallable: HttpsCallable<AddReviewCFData, AddReviewCFResponse> | undefined;

  if (functionsClient && Object.keys(functionsClient).length > 0) {
    try {
      getProductReviewsCallable = httpsCallable(functionsClient, 'reviews-getProductReviewsCF');
      addReviewCallable = httpsCallable(functionsClient, 'reviews-addReviewCF');
      console.log("ProductReviews: Live httpsCallable references created for review functions.");
    } catch (error) {
      console.error("ProductReviews: Error preparing httpsCallable for review functions:", error);
      toast.error("Error initializing connection to review services.");
    }
  } else {
    console.warn("ProductReviews: Firebase functions client not available. Review operations will fail.");
    // TODO: Consider mock fallbacks for UI development if desired
  }

  // Helper to map BEProductReview to local Review type
  const mapBEToLocalReview = (beReview: BEProductReview, pId: string): Review => ({
    id: beReview.id,
    productId: pId, // productId is from props, beReview might not have it directly if not returned by CF explicitly
    userId: beReview.userId,
    userName: beReview.reviewerName || 'Anonymous',
    rating: beReview.rating,
    title: '', // BE model does not have title
    comment: beReview.comment || '',
    date: beReview.createdAt ? (beReview.createdAt as Timestamp).toDate().toLocaleDateString() : new Date().toLocaleDateString(),
    isVerifiedPurchase: false, // BE model does not have this
    helpfulVotes: 0, // BE model does not have this
    userVoted: false, // BE model does not have this
  });

  // Fetch reviews on component mount
  useEffect(() => {
    const fetchReviews = async () => {
      if (!getProductReviewsCallable) {
        toast.error("Review service is not available.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true); // Ensure loading is true at start
        const result = await getProductReviewsCallable({ productId });
        if (result.data.success && result.data.reviews) {
          const fetchedReviews = result.data.reviews.map(r => mapBEToLocalReview(r, productId));
          setReviews(fetchedReviews);
          
          if (fetchedReviews.length > 0) {
            const totalRating = fetchedReviews.reduce((sum, review) => sum + review.rating, 0);
            setAverageRating(totalRating / fetchedReviews.length);
          } else {
            setAverageRating(0);
          }
        } else {
          console.error('Error fetching product reviews:', result.data.error);
          toast.error(result.data.error || 'Failed to load product reviews');
          setAverageRating(0); // Reset on error
        }
      } catch (error: unknown) {
        console.error('Error fetching product reviews:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to load product reviews: ${message}`);
        setAverageRating(0); // Reset on error
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) { // Ensure productId is available
      fetchReviews();
    }
  }, [productId, getProductReviewsCallable]); // Depend on productId and callable to refetch if they change

  // Handle star rating click
  const handleRatingClick = (rating: number) => {
    setUserReview(prev => ({ ...prev, rating }));
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserReview(prev => ({ ...prev, [name]: value }));
  };

  // Handle review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit a review');
      navigate('/login'); // Make sure navigate is imported from react-router-dom
      return;
    }
    
    if (userReview.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!userReview.title.trim()) { // Title is in form, but not sent to BE currently
      toast.error('Please add a title for your review');
      return;
    }
    
    if (!userReview.comment.trim()) {
      toast.error('Please add a comment for your review');
      return;
    }

    if (!addReviewCallable) {
      toast.error("Review submission service is not available.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reviewPayload: AddReviewCFData = {
        productId,
        rating: userReview.rating,
        comment: userReview.comment,
      };
      
      const result = await addReviewCallable(reviewPayload);
      
      if (result.data.success && result.data.review) {
        const newReview = mapBEToLocalReview(result.data.review, productId);
        // Add the new review to the list
        setReviews(prev => [newReview, ...prev]);
        
        // Recalculate average
        // Note: prev might not be immediately updated from setReviews, so use the newReview and spread of prev
        const updatedReviewsForAvg = [newReview, ...reviews];
        const totalRating = updatedReviewsForAvg.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(totalRating / updatedReviewsForAvg.length);
        
        // Reset form
        setUserReview({ rating: 0, title: '', comment: '' });
        setShowReviewForm(false);
        
        toast.success('Review submitted successfully!');
      } else {
        console.error('Error submitting review:', result.data.error);
        toast.error(result.data.error || 'Failed to submit review');
      }
    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to submit review: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle helpful vote
  const handleHelpfulVote = async (reviewId: string) => {
    console.warn("handleHelpfulVote is currently disabled as voteReviewHelpful service function is not available.");
    // toast("Voting on reviews is temporarily unavailable."); // Commented out to resolve lint error
  };

  // Render star rating
  const renderStars = (rating: number, interactive = false) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={interactive ? 24 : 16}
        className={`${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer' : ''}`}
        onClick={interactive ? () => handleRatingClick(i + 1) : undefined}
      />
    ));
  };

  // Determine if user has already reviewed this product
  const userHasReviewed = user && reviews.some(review => review.userId === user.id);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center mt-1">
              <div className="flex mr-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="text-sm">
                {averageRating.toFixed(1)} out of 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        {!showReviewForm && !userHasReviewed && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {showReviewForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Write a Review for {productName}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmitReview}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium">Rating</label>
                <div className="flex space-x-1">
                  {renderStars(userReview.rating, true)}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="title" className="font-medium">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Summarize your experience"
                  value={userReview.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="comment" className="font-medium">Comment</label>
                <Textarea
                  id="comment"
                  name="comment"
                  placeholder="Share your experience with this product"
                  value={userReview.comment}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(review.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.isVerifiedPurchase && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Verified Purchase
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2">{review.title}</h4>
                <p className="text-muted-foreground">{review.comment}</p>
              </CardContent>
              <CardFooter className="pt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-1 text-muted-foreground"
                  onClick={() => handleHelpfulVote(review.id)}
                  disabled={review.userVoted}
                >
                  <ThumbsUp size={16} />
                  <span>Helpful ({review.helpfulVotes})</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground">
            This product has no reviews yet. Be the first to share your experience!
          </p>
          {!showReviewForm && !userHasReviewed && (
            <Button onClick={() => setShowReviewForm(true)} className="mt-4">
              Write a Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductReviews; 