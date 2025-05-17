// src/components/checkout/UpiQRCode.tsx
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Using qrcode.react

// Placeholder for a QR code generation library. 
// In a real app, you might use a library like 'qrcode.react' or 'react-qr-code'.
// const QRCode = require('qrcode.react'); // Example import if using qrcode.react

interface UpiQRCodeProps {
  amount: number;
  upiId: string; // Admin-configured UPI ID (VPA)
  merchantName?: string; // Optional: Store name or merchant name
  transactionNote?: string; // Optional: Note for the transaction, e.g., Order ID
  onLoad?: () => void; // Callback when QR code data is ready (or image is rendered by library)
  onError?: (error: Error) => void; // Callback for any errors during QR generation
}

const UpiQRCode: React.FC<UpiQRCodeProps> = ({
  amount,
  upiId,
  merchantName = 'Your Store Name', // Default merchant name
  transactionNote = 'Order Payment',
  onLoad,
  onError,
}) => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorGenerating, setErrorGenerating] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setErrorGenerating(null);
    if (!upiId || amount <= 0) {
      const errorMsg = 'Invalid UPI ID or amount for QR code generation.';
      console.error(errorMsg);
      if (onError) onError(new Error(errorMsg));
      setErrorGenerating(errorMsg);
      setIsLoading(false);
      setQrData(null);
      return;
    }

    // Construct the UPI payment string
    // Standard UPI QR Code string format: upi://pay?pa=<VPA>&pn=<PayeeName>&am=<Amount>&tn=<TransactionNote>&cu=INR
    // Ensure parameters are URL encoded if they contain special characters.
    const params = new URLSearchParams();
    params.append('pa', upiId);
    params.append('pn', merchantName);
    params.append('am', amount.toFixed(2));
    params.append('tn', transactionNote);
    params.append('cu', 'INR'); // Assuming currency is INR

    const upiString = `upi://pay?${params.toString()}`;
    setQrData(upiString);
    setIsLoading(false);
    
    if (onLoad) {
      onLoad();
    }

  }, [amount, upiId, merchantName, transactionNote, onLoad, onError]);

  if (isLoading) {
    return <div className="text-center p-4 animate-pulse">Generating UPI QR Code...</div>;
  }

  if (errorGenerating || !qrData) {
    return <div className="text-center p-4 text-red-500">Error: {errorGenerating || "Could not generate UPI QR Code."}</div>;
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3">Scan to Pay with UPI</h3>
      <div className="p-2 bg-gray-100 rounded-md mb-3">
        <QRCodeSVG 
            value={qrData} 
            size={200} // Adjust size as needed, e.g., 192 for w-48, 224 for w-56
            bgColor="#ffffff"
            fgColor="#000000"
            level="H" // Error correction level: L, M, Q, H
            imageSettings={{
                // src: "/path/to/logo.png", // Optional: embed a logo in the QR code
                // height: 30,
                // width: 30,
                // excavate: true,
            }}
        />
      </div>
      <p className="text-sm text-gray-700 mb-1">
        <strong>Amount:</strong> ₹{amount.toFixed(2)}
      </p>
      <p className="text-xs text-gray-500 mb-1">
        <strong>UPI ID:</strong> {upiId}
      </p>
      {transactionNote && (
        <p className="text-xs text-gray-500 mb-3">
          <strong>Note:</strong> {transactionNote}
        </p>
      )}
      <p className="text-xs text-center text-gray-500">
        Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.) to complete your payment.
      </p>
    </div>
  );
};

export default UpiQRCode;
