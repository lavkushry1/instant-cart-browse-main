import { toast } from 'sonner';

/**
 * UPI Service - Handles UPI ID storage and retrieval
 */

// LocalStorage key for UPI ID
const UPI_ID_KEY = 'storeUpiId';

// Default UPI ID if none is set
const DEFAULT_UPI_ID = 'store@yesbank';

/**
 * Save UPI ID to local storage
 * @param upiId - UPI ID to save
 */
export const saveUpiId = (upiId: string): void => {
  localStorage.setItem(UPI_ID_KEY, upiId);
};

/**
 * Get UPI ID from local storage
 * @returns UPI ID or default value if not set
 */
export const getUpiId = (): string => {
  return localStorage.getItem(UPI_ID_KEY) || DEFAULT_UPI_ID;
};

/**
 * Validate UPI ID format
 * @param upiId - UPI ID to validate
 * @returns boolean indicating if the UPI ID is valid
 */
export const validateUpiId = (upiId: string): boolean => {
  // Basic UPI ID validation (username@provider)
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(upiId);
};

/**
 * Generate UPI payment URL
 * @param upiId - UPI ID to send payment to
 * @param amount - Payment amount
 * @param orderId - Order ID for reference
 * @returns UPI payment URL string
 */
export const generateUpiPaymentUrl = (
  upiId: string,
  amount: number,
  orderId: string
): string => {
  // Format: upi://pay?pa=UPI_ID&pn=MERCHANT_NAME&am=AMOUNT&cu=CURRENCY&tn=TRANSACTION_NOTE
  return `upi://pay?pa=${upiId}&pn=InstantCart&am=${amount.toFixed(2)}&cu=INR&tn=Order ${orderId}`;
};

/**
 * Mock function to verify UPI payment status
 * This would typically be an API call to your payment gateway in a real application
 * @param orderId - Order ID to check payment for
 * @returns Promise that resolves to a boolean indicating payment success
 */
export const verifyUpiPayment = async (orderId: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
      
  // For demo purposes, randomly determine if payment was successful
  // In a real app, this would be based on payment gateway response
  return Math.random() < 0.7; // 70% success rate for demo
};

/**
 * Log UPI payment for admin records
 * @param orderId - Order ID
 * @param amount - Payment amount
 * @param upiId - UPI ID payment was sent to
 * @param status - Payment status
 */
export const logUpiPayment = (
  orderId: string,
  amount: number,
  upiId: string,
  status: 'pending' | 'success' | 'failed'
): void => {
  // In a real app, this would send data to your backend
  // For demo, we'll just log to console and localStorage
  const logEntry = {
    orderId,
    amount,
    upiId,
    status,
    timestamp: new Date().toISOString()
  };
  
  console.log('UPI Payment Log:', logEntry);
  
  // Store in localStorage for demo purposes
  const existingLogs = JSON.parse(localStorage.getItem('upiPaymentLogs') || '[]');
  existingLogs.push(logEntry);
  localStorage.setItem('upiPaymentLogs', JSON.stringify(existingLogs));
};
