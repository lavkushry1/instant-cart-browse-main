import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductReviews from './ProductReviews';
import { toast } from 'react-hot-toast';

// Mock the auth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user123', name: 'Test User' }
  }))
}));

// Mock review service
vi.mock('../services/reviewService', () => ({
  getProductReviews: vi.fn(() => Promise.resolve([
    {
      id: 'review1',
      productId: 'product123',
      userId: 'user456',
      userName: 'John Doe',
      rating: 4,
      title: 'Great product',
      comment: 'This is a great product, I love it!',
      date: '2023-10-15T10:30:00Z',
      isVerifiedPurchase: true,
      helpfulVotes: 5
    },
    {
      id: 'review2',
      productId: 'product123',
      userId: 'user789',
      userName: 'Jane Smith',
      rating: 2,
      title: 'Not impressed',
      comment: 'Expected better quality for the price.',
      date: '2023-10-10T15:45:00Z',
      isVerifiedPurchase: false,
      helpfulVotes: 2
    }
  ])),
  addProductReview: vi.fn((productId, userId, reviewData) => Promise.resolve({
    id: 'new-review-id',
    productId,
    userId,
    userName: 'Test User',
    rating: reviewData.rating,
    title: reviewData.title,
    comment: reviewData.comment,
    date: new Date().toISOString(),
    isVerifiedPurchase: true,
    helpfulVotes: 0
  })),
  voteReviewHelpful: vi.fn((reviewId) => Promise.resolve({
    id: reviewId,
    productId: 'product123',
    userId: 'user456',
    userName: 'John Doe',
    rating: 4,
    title: 'Great product',
    comment: 'This is a great product, I love it!',
    date: '2023-10-15T10:30:00Z',
    isVerifiedPurchase: true,
    helpfulVotes: 6,
    userVoted: true
  }))
}));

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('ProductReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product reviews correctly', async () => {
    render(
      <MemoryRouter>
        <ProductReviews productId="product123" productName="Test Product" />
      </MemoryRouter>
    );

    // Should show loading state initially
    expect(screen.getByText(/loading reviews/i)).toBeInTheDocument();

    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.getByText('Great product')).toBeInTheDocument();
    });

    // Should show both reviews
    expect(screen.getByText('Great product')).toBeInTheDocument();
    expect(screen.getByText('Not impressed')).toBeInTheDocument();

    // Should show verified purchase badge
    expect(screen.getByText('Verified Purchase')).toBeInTheDocument();

    // Should show ratings
    expect(screen.getByText(/4 out of 5/)).toBeInTheDocument();
  });

  it('allows user to write a review', async () => {
    render(
      <MemoryRouter>
        <ProductReviews productId="product123" productName="Test Product" />
      </MemoryRouter>
    );

    // Wait for reviews to load and Write Review button to appear
    await waitFor(() => {
      expect(screen.getByText('Write a Review')).toBeInTheDocument();
    });

    // Click the Write a Review button
    await userEvent.click(screen.getByText('Write a Review'));

    // Should show review form
    expect(screen.getByText(`Write a Review for Test Product`)).toBeInTheDocument();

    // Fill out the form
    const stars = screen.getAllByRole('img');
    // Click the third star (rating 3)
    await userEvent.click(stars[2]);

    // Fill in title and comment
    await userEvent.type(
      screen.getByPlaceholderText('Summarize your experience'),
      'Good overall'
    );
    await userEvent.type(
      screen.getByPlaceholderText('Share your experience with this product'),
      'Works as expected. Good value for money.'
    );

    // Submit the review
    await userEvent.click(screen.getByText('Submit Review'));

    // Wait for success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Review submitted successfully!'
      );
    });
  });

  it('allows voting for helpful reviews', async () => {
    render(
      <MemoryRouter>
        <ProductReviews productId="product123" productName="Test Product" />
      </MemoryRouter>
    );

    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.getByText('Great product')).toBeInTheDocument();
    });

    // Find the helpful button for the first review
    const helpfulButton = screen.getByText(/helpful \(5\)/i);
    
    // Click the helpful button
    await userEvent.click(helpfulButton);

    // Wait for the vote to be processed and UI updated
    await waitFor(() => {
      // The helpful count should have increased to 6
      expect(screen.getByText(/helpful \(6\)/i)).toBeInTheDocument();
    });
  });
});