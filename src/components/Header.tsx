import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Home, Tag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

const Header = () => {
  const { user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Get cart item count
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  // Handle scroll event to add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    } else {
      // Just navigate to search page with no query
      navigate('/search');
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={cn(
      "bg-white sticky top-0 z-50 transition-all duration-200",
      isScrolled ? "shadow-md" : "border-b"
    )}>
      <div className="container py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-xl md:text-2xl font-bold text-primary">
            InstantCart
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={cn(
                "hover:text-primary transition-colors",
                location.pathname === '/' && "text-primary font-medium"
              )}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={cn(
                "hover:text-primary transition-colors",
                location.pathname.includes('/product') && "text-primary font-medium"
              )}
            >
              Shop
            </Link>
            <Link 
              to="/deals" 
              className={cn(
                "hover:text-primary transition-colors",
                location.pathname === '/deals' && "text-primary font-medium"
              )}
            >
              Deals
            </Link>
          </nav>

          {/* Search button for mobile - navigates to dedicated search page */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => navigate('/search')}
          >
            <Search size={20} />
          </Button>

          {/* Search form - desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex items-center max-w-sm w-full mx-4"
          >
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" variant="ghost" size="icon">
              <Search size={20} />
            </Button>
          </form>

          {/* User actions - desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Link to={user ? "/account" : "/login"}>
              <Button variant="ghost" size="icon">
                <User size={24} />
              </Button>
            </Link>
          </div>
          
          {/* Mobile menu toggle */}
          <Button 
            className="md:hidden"
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4 pt-4 border-t">
            <form 
              onSubmit={handleSearch}
              className="flex items-center mb-4"
            >
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="ghost" size="icon">
                <Search size={20} />
              </Button>
            </form>

            <nav className="flex flex-col space-y-1">
              <Link 
                to="/" 
                className={cn(
                  "p-3 rounded-md flex items-center",
                  location.pathname === '/' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <Home size={18} className="mr-3" />
                Home
              </Link>
              
              <Link 
                to="/products" 
                className={cn(
                  "p-3 rounded-md flex items-center",
                  location.pathname.includes('/product') ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <Tag size={18} className="mr-3" />
                Shop
              </Link>
              
              <Link 
                to="/deals" 
                className={cn(
                  "p-3 rounded-md flex items-center",
                  location.pathname === '/deals' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <Tag size={18} className="mr-3" />
                Deals
              </Link>
              
              <Link 
                to="/wishlist" 
                className={cn(
                  "p-3 rounded-md flex items-center",
                  location.pathname === '/wishlist' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart size={18} className="mr-3" />
                Wishlist
              </Link>
              
              <Link 
                to="/cart" 
                className={cn(
                  "p-3 rounded-md flex items-center",
                  location.pathname === '/cart' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart size={18} className="mr-3" />
                Cart 
                {cartItemCount > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-1 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              
              <Link 
                to={user ? "/account" : "/login"} 
                className={cn(
                  "p-3 rounded-md flex items-center",
                  (location.pathname === '/account' || location.pathname === '/login') ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={18} className="mr-3" />
                {user ? 'My Account' : 'Sign In'}
              </Link>
            </nav>
            
            {user && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Signed in as:</p>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 