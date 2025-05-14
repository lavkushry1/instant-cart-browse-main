import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';

// Mock dependencies
vi.mock('../services/cartService', () => ({
  loadCart: vi.fn(() => [
    {
      product: {
        id: '1',
        name: 'Test Product',
        price: 999,
        discount: 0,
        stock: 10,
        images: ['test-image.jpg'],
        description: 'Test description',
        category: 'Test Category'
      },
      quantity: 2
    }
  ]),
  getCartTotals: vi.fn(() => ({
    subtotal: 1998,
    totalItems: 2
  })),
  clearCart: vi.fn()
}));

vi.mock('../services/upiService', () => ({
  saveUpiId: vi.fn(),
  getUpiId: vi.fn(() => 'test@upi')
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock toast component
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}));

// Mock child components to simplify testing
vi.mock('../components/checkout/DeliveryDetails', () => ({
  default: ({ onSubmit }) => (
    <div data-testid="delivery-details">
      <button 
        onClick={() => onSubmit({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          saveInfo: true
        })}
      >
        Submit Delivery Details
      </button>
    </div>
  )
}));

vi.mock('../components/checkout/PaymentMethods', () => ({
  default: ({ onSubmit }) => (
    <div data-testid="payment-methods">
      <button onClick={() => onSubmit('upi')}>Pay with UPI</button>
      <button onClick={() => onSubmit('card')}>Pay with Card</button>
    </div>
  )
}));

vi.mock('../components/checkout/OrderSummary', () => ({
  default: () => <div data-testid="order-summary">Order Summary</div>
}));

vi.mock('../components/checkout/OrderSuccess', () => ({
  default: () => <div data-testid="order-success">Order Success</div>
}));

vi.mock('../components/checkout/OrderTracking', () => ({
  default: () => <div data-testid="order-tracking">Order Tracking</div>
}));

vi.mock('../components/checkout/AdminUpiSettings', () => ({
  default: ({ onSave }) => (
    <div data-testid="admin-upi-settings">
      <button onClick={() => onSave('new@upi')}>Save UPI</button>
    </div>
  )
}));

vi.mock('../components/layout/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>
}));

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders the delivery step initially', () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('delivery-details')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });

  it('progresses to payment step after submitting delivery details', async () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );
    
    // Submit delivery details
    await userEvent.click(screen.getByText('Submit Delivery Details'));
    
    // Should now show payment methods
    expect(screen.getByTestId('payment-methods')).toBeInTheDocument();
  });

  it('progresses to success and then tracking step after payment', async () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );
    
    // Submit delivery details
    await userEvent.click(screen.getByText('Submit Delivery Details'));
    
    // Make payment
    await userEvent.click(screen.getByText('Pay with UPI'));
    
    // Should now show success page
    expect(screen.getByTestId('order-success')).toBeInTheDocument();
    
    // Advance timers to trigger tracking page
    vi.advanceTimersByTime(5000);
    
    // Should now show tracking page
    await waitFor(() => {
      expect(screen.getByTestId('order-tracking')).toBeInTheDocument();
    });
  });

  it('can toggle admin settings', async () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );
    
    // Initially admin settings should be hidden
    expect(screen.queryByTestId('admin-upi-settings')).not.toBeInTheDocument();
    
    // Click to show admin settings
    await userEvent.click(screen.getByText('Show Admin Settings'));
    
    // Now admin settings should be visible
    expect(screen.getByTestId('admin-upi-settings')).toBeInTheDocument();
    
    // Save new UPI ID
    await userEvent.click(screen.getByText('Save UPI'));
    
    // Click to hide admin settings
    await userEvent.click(screen.getByText('Hide Admin Settings'));
    
    // Admin settings should be hidden again
    expect(screen.queryByTestId('admin-upi-settings')).not.toBeInTheDocument();
  });
}); 