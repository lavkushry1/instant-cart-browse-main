import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculatePasswordStrength = (password: string): { strength: 'Weak' | 'Medium' | 'Strong' | 'Very Strong', score: number, color: string } => {
    let score = 0;
    if (!password) return { strength: 'Weak', score: 0, color: 'bg-gray-200' };

    // Criteria
    const lengthCriteria = password.length >= 8;
    const minLengthMet = password.length >= 6;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    if (password.length > 0) score +=1; // Very basic starting point
    if (minLengthMet) score += 1;
    if (lengthCriteria) score += 1;
    if (hasLowerCase) score += 1;
    if (hasUpperCase) score += 1;
    if (hasNumbers) score += 1;
    if (hasSymbols) score += 1;
    
    if (password.length < 6) return { strength: 'Weak', score: Math.max(1, score -4), color: 'bg-red-500' }; // Penalize short passwords heavily for score

    if (score < 4) return { strength: 'Weak', score, color: 'bg-red-500' };
    if (score < 6) return { strength: 'Medium', score, color: 'bg-orange-500' };
    if (score < 7) return { strength: 'Strong', score, color: 'bg-yellow-500' }; // Adjusted for more granularity
    return { strength: 'Very Strong', score, color: 'bg-green-500' };
  };
  
  const passwordStrengthDetails = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Remove confirmPassword from registration data
      const { confirmPassword, ...registrationData } = formData;
      
      const user = await register(registrationData);
      
      if (user) {
        toast.success('Registration successful!');
        navigate('/account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container py-10">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>
                Enter your details to create your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {formData.password && (
                    <div className="mt-2">
                      <div className="h-2 w-full bg-gray-200 rounded">
                        <div
                          className={`h-full rounded ${passwordStrengthDetails.color}`}
                          style={{ width: `${(passwordStrengthDetails.score / 7) * 100}%` }} // Max score is 7
                        ></div>
                      </div>
                      <p className={`text-xs mt-1 ${
                        passwordStrengthDetails.strength === 'Weak' ? 'text-red-500' :
                        passwordStrengthDetails.strength === 'Medium' ? 'text-orange-500' :
                        passwordStrengthDetails.strength === 'Strong' ? 'text-yellow-600' : 'text-green-600' // Darker yellow for better readability
                      }`}>
                        Strength: {passwordStrengthDetails.strength}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">
                    Password must be at least 6 characters long. Consider using a mix of uppercase, lowercase, numbers, and symbols for a stronger password.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Register; 