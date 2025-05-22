import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu,
  X,
  // Search as SearchIcon, // Renamed to avoid conflict if SearchBar is also named Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input'; // Will be replaced by SearchBar
import SearchBar from './SearchBar'; // Import SearchBar
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header = () => {
  const { user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate(); // Initialize useNavigate
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const cartItemsCount = cart?.length || 0;

  const staticSuggestions = ["Laptop", "Smartphone", "Headphones", "Wireless Mouse", "Keyboard", "Webcam", "Monitor"];

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };
  
  const mainNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Deals', path: '/deals' },
    { name: 'About', path: '/about' },
  ];

  const getInitials = (name: string) => {
    return name?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold">
            Instant<span className="text-primary">Cart</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {mainNavItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[380px]">
            <div className="flex flex-col space-y-4 py-4">
              <div className="flex justify-between items-center border-b pb-4">
                <Link to="/" className="text-xl font-bold">
                  Instant<span className="text-primary">Cart</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <CurrencySelector showLabel position="sidebar" minWidth="100%" />
              
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <Link 
                        to="/account" 
                        className="text-xs text-muted-foreground hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Account
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="w-full">
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                        Sign up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Search, User, Cart, Currency Controls */}
        <div className="flex items-center space-x-3">
          {/* SearchBar Component */}
          <div className="hidden md:block w-[200px] lg:w-[300px]">
            <SearchBar onSearch={handleSearch} suggestions={staticSuggestions} />
          </div>
          
          {/* Currency Selector (Desktop) */}
          <div className="hidden md:block">
            <CurrencySelector />
          </div>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* User Account */}
          <div className="hidden md:block">
            {user ? (
              <Link to="/account">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
          
          {/* Cart */}
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 p-0 text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}; 