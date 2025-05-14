import { toast } from "react-hot-toast";
import { Review } from "@/components/ProductReviews";
import { getCurrentUser } from "./userService";

// LocalStorage key for reviews
const REVIEWS_KEY = 'instant-cart-reviews';
const REVIEW_VOTES_KEY = 'instant-cart-review-votes';

interface ReviewInput {
  rating: number;
  title: string;
  comment: string;
}

/**
 * Get all reviews for a specific product
 * @param productId - Product ID
 * @returns Array of reviews
 */
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    // In a real app, this would be an API call
    // For demo, we use localStorage
    const reviewsJson = localStorage.getItem(REVIEWS_KEY) || '{}';
    const allReviews = JSON.parse(reviewsJson);
    
    // Get product reviews
    const productReviews = allReviews[productId] || [];
    
    // Get current user for marking votes
    const currentUser = getCurrentUser();
    
    if (currentUser) {
      // Get user votes
      const votesJson = localStorage.getItem(REVIEW_VOTES_KEY) || '{}';
      const allVotes = JSON.parse(votesJson);
      const userVotes = allVotes[currentUser.id] || [];
      
      // Mark reviews the user has voted for
      return productReviews.map((review: Review) => ({
        ...review,
        userVoted: userVotes.includes(review.id)
      }));
    }
    
    return productReviews;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
};

/**
 * Add a review for a product
 * @param productId - Product ID
 * @param userId - User ID
 * @param reviewData - Review data (rating, title, comment)
 * @returns The newly created review, or null if failed
 */
export const addProductReview = async (
  productId: string, 
  userId: string, 
  reviewData: ReviewInput
): Promise<Review | null> => {
  try {
    // Get current user
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      toast.error('You must be logged in to leave a review');
      return null;
    }
    
    // Get all reviews
    const reviewsJson = localStorage.getItem(REVIEWS_KEY) || '{}';
    const allReviews = JSON.parse(reviewsJson);
    
    // Get product reviews
    const productReviews = allReviews[productId] || [];
    
    // Check if user already reviewed this product
    const existingReview = productReviews.find((review: Review) => review.userId === userId);
    
    if (existingReview) {
      toast.error('You have already reviewed this product');
      return null;
    }
    
    // Create new review
    const newReview: Review = {
      id: crypto.randomUUID(),
      productId,
      userId,
      userName: currentUser.name,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      date: new Date().toISOString(),
      isVerifiedPurchase: false, // In a real app, would check purchase history
      helpfulVotes: 0,
      userVoted: false
    };
    
    // Add to product reviews
    allReviews[productId] = [newReview, ...productReviews];
    
    // Save back to localStorage
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
    
    return newReview;
  } catch (error) {
    console.error('Error adding product review:', error);
    return null;
  }
};

/**
 * Vote a review as helpful
 * @param reviewId - Review ID
 * @param userId - User ID
 * @returns The updated review, or null if failed
 */
export const voteReviewHelpful = async (
  reviewId: string, 
  userId: string
): Promise<Review | null> => {
  try {
    // Get current user
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      toast.error('You must be logged in to vote');
      return null;
    }
    
    // Get all reviews
    const reviewsJson = localStorage.getItem(REVIEWS_KEY) || '{}';
    const allReviews = JSON.parse(reviewsJson);
    
    // Get user votes
    const votesJson = localStorage.getItem(REVIEW_VOTES_KEY) || '{}';
    const allVotes = JSON.parse(votesJson);
    const userVotes = allVotes[userId] || [];
    
    // Check if user already voted for this review
    if (userVotes.includes(reviewId)) {
      toast.error('You have already voted for this review');
      return null;
    }
    
    // Find the review
    let updatedReview: Review | null = null;
    
    // Iterate through all products
    for (const productId in allReviews) {
      const productReviews = allReviews[productId];
      const reviewIndex = productReviews.findIndex((review: Review) => review.id === reviewId);
      
      if (reviewIndex !== -1) {
        // Increment helpful votes
        productReviews[reviewIndex].helpfulVotes += 1;
        updatedReview = { ...productReviews[reviewIndex], userVoted: true };
        allReviews[productId] = productReviews;
        break;
      }
    }
    
    if (!updatedReview) {
      toast.error('Review not found');
      return null;
    }
    
    // Save updated reviews
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
    
    // Save user vote
    allVotes[userId] = [...userVotes, reviewId];
    localStorage.setItem(REVIEW_VOTES_KEY, JSON.stringify(allVotes));
    
    toast.success('Thank you for your feedback!');
    return updatedReview;
  } catch (error) {
    console.error('Error voting for review:', error);
    return null;
  }
}; 