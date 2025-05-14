import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for newsletter subscription would go here
    alert('Thank you for subscribing to our newsletter!');
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">InstantCart</h3>
            <p className="mb-4">
              Your one-stop shop for all your shopping needs. Fast delivery, quality products, and exceptional customer service.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook size={20} className="hover:text-primary transition-colors" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter size={20} className="hover:text-primary transition-colors" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram size={20} className="hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
              </li>
              <li>
                <Link to="/deals" className="hover:text-primary transition-colors">Deals</Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-primary transition-colors">My Account</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary transition-colors">Cart</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <MapPin size={20} className="mr-2 text-primary" />
                <span>123 Shopping St, Business District, City</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 text-primary" />
                <span>+1 234 567 8900</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-2 text-primary" />
                <span>info@instantcart.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Newsletter</h3>
            <p className="mb-4">Subscribe to receive updates on new products and special promotions.</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <Input
                type="email"
                placeholder="Your email address"
                required
                className="bg-gray-800 border-gray-700"
              />
              <Button type="submit" className="w-full">Subscribe</Button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p>© {currentYear} InstantCart. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link to="/privacy" className="hover:text-primary transition-colors text-sm">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors text-sm">Terms of Service</Link>
            <Link to="/refund" className="hover:text-primary transition-colors text-sm">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 