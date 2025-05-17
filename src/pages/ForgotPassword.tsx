import { useState } from 'react';
import { Link } from 'react-router-dom';
// import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // getAuth removed
import { sendPasswordResetEmail } from 'firebase/auth';
// import { firebaseApp } from '@/lib/firebaseClient'; // firebaseApp removed
import { authClient } from '@/lib/firebaseClient'; // authClient imported directly
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// const auth = getAuth(firebaseApp); // Removed: use authClient directly

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [message, setMessage] = useState(''); // Removed message state
  const [emailSent, setEmailSent] = useState(false); // To change card description

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) { // Basic email format validation
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    // setMessage(''); // Removed

    if (!authClient || Object.keys(authClient).length === 0) { // Check if authClient is valid
      toast.error('Authentication service is not available. Please try again later.');
      setIsSubmitting(false);
      return;
    }

    try {
      await sendPasswordResetEmail(authClient, email); // Use authClient
      toast.success('Password reset email sent! Please check your inbox (and spam folder).');
      setEmailSent(true);
      // setEmail(''); // Optionally clear email field, or let user see what they submitted
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No user found with this email address. Please check the email and try again.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('The email address is not valid.');
      } else {
        toast.error(error.message || 'Failed to send password reset email. Please try again.');
      }
      setEmailSent(false); // Ensure form is shown again on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container py-10 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
              <CardDescription>
                {emailSent
                  ? "If an account with that email exists, a password reset link has been sent."
                  : "Enter your email address and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>
            {!emailSent ? (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  {/* {message && ( // Message display removed, relying on toasts
                    <p className={`text-sm ${message.startsWith('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                      {message}
                    </p>
                  )} */}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Please check your email for the reset link. You can close this page.
                </p>
              </CardContent>
            )}
            <CardFooter className="text-center text-sm">
              <Link 
                to="/login" 
                className="text-primary hover:underline"
              >
                Back to Login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ForgotPassword; 