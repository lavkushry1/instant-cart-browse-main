import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Home, Tag, Heart, ChevronDown, Bell, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { cn } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
      "transition-all duration-200 z-50 sticky top-0",
      isScrolled ? "shadow-md" : ""
    )}>
      {/* Top Navbar - Flipkart Blue */}
      <div className="bg-flipkart-blue text-white">
        <div className="container py-2 md:py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/" className="mr-3">
                <img src="/flipkart-logo.svg" alt="Instant Cart" className="h-6 md:h-7" />
              </Link>
              
              {/* Search form - expandable on mobile */}
              <form 
                onSubmit={handleSearch}
                className="relative max-w-xl w-full mx-2 md:ml-6"
              >
                <Input
                  type="search"
                  placeholder="Search for products, brands and more"
                  className="w-full rounded-sm py-1.5 pl-3 pr-10 bg-white text-black text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="ghost" size="icon" className="absolute top-0 right-0 h-full text-flipkart-blue">
                  <Search size={18} />
                </Button>
              </form>
            </div>

            {/* Mobile menu toggle */}
            <Button 
              className="md:hidden text-white"
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>

            {/* Desktop Nav Menu */}
            <nav className="hidden md:flex items-center space-x-5">
              {/* Login Button with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-blue-600 px-3">
                    <span className="flex items-center">
                      {user ? (user.displayName?.split(' ')[0] || 'Account') : 'Login'}
                      <ChevronDown size={16} className="ml-1" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-1">
                  {!user ? (
                    <>
                      <div className="p-3 flex justify-between items-center border-b">
                        <h4 className="font-medium">New Customer?</h4>
                        <Link to="/register" className="text-flipkart-blue text-sm">Sign Up</Link>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to="/login" className="cursor-pointer">Sign In</Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel>
                        {user.displayName || user.firstName || 'Welcome!'}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer">Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders" className="cursor-pointer">Orders</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Other Menu Items */}
              <Link to="/cart" className="flex items-center text-white hover:text-white/90">
                <ShoppingCart size={20} className="mr-1.5" />
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Category Navigation Bar - White */}
      <div className="bg-white shadow-sm py-2 hidden md:block">
        <div className="container">
          <nav className="flex items-center justify-between overflow-x-auto pb-1">
            <Link to="/category/electronics" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>Electronics</span>
            </Link>
            <Link to="/category/mobiles" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>Mobiles</span>
            </Link>
            <Link to="/category/fashion" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>Fashion</span>
            </Link>
            <Link to="/category/appliances" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>Appliances</span>
            </Link>
            <Link to="/category/grocery" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>Grocery</span>
            </Link>
            <Link to="/category/furniture" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>Furniture</span>
            </Link>
            <Link to="/deals" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>Top Offers</span>
            </Link>
            <Link to="/products/new" className="whitespace-nowrap px-3 py-1 flex flex-col items-center hover:text-blue-600">
              <span>New Arrivals</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Menu - Slides from side */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
          
          {/* Menu Panel */}
          <div className="absolute top-0 left-0 h-full w-4/5 max-w-xs bg-white shadow-xl overflow-y-auto">
            {/* User/Login area */}
            <div className="bg-flipkart-blue text-white p-4">
              {user ? (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white mr-3">
                    {(user.displayName?.[0] || user.firstName?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.displayName || user.firstName || 'User'}</p>
                    <p className="text-xs text-white/70 truncate max-w-[180px]">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Login</span>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="bg-white text-flipkart-blue px-3 py-1 rounded-sm text-sm font-medium">Sign In</Link>
                </div>
              )}
            </div>
            
            {/* Navigation Links */}
            <nav className="divide-y">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <Home size={16} className="mr-3 text-flipkart-blue" />
                <span>Home</span>
              </Link>
              
              <Link to="/category/electronics" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <span>Electronics</span>
              </Link>
              
              <Link to="/category/mobiles" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <span>Mobiles</span>
              </Link>
              
              <Link to="/category/fashion" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <span>Fashion</span>
              </Link>
              
              <Link to="/deals" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <Tag size={16} className="mr-3 text-flipkart-blue" />
                <span>Top Offers</span>
              </Link>
              
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <Heart size={16} className="mr-3 text-flipkart-blue" />
                <span>Wishlist</span>
              </Link>
              
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center">
                  <ShoppingCart size={16} className="mr-3 text-flipkart-blue" />
                  <span>Cart</span>
                </div>
                {cartItemCount > 0 && (
                  <span className="bg-flipkart-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              
              <Link to="/account/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <span>My Orders</span>
              </Link>
              
              <Link to="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 hover:bg-gray-50">
                <User size={16} className="mr-3 text-flipkart-blue" />
                <span>My Account</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 