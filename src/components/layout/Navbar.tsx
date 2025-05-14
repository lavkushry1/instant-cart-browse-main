import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories } from '../../data/products';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Search, ShoppingCart, User, Heart, Menu, X, LogOut, Settings, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrencySelector } from '@/components/currency/CurrencySelector';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [savedItemsCount, setSavedItemsCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { cart, savedItems } = useCart();
  const { user, logout } = useAuth();

  const popularSearches = [
    "Ultrabook", "Smart TV", "Wireless Headphones", "Gaming Console", "Smartphone"
  ];

  // Handle scroll event to make navbar sticky
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Update cart and saved items count whenever the cart or savedItems change
  useEffect(() => {
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    setSavedItemsCount(savedItems.length);
  }, [cart, savedItems]);

  // Handle click outside search to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setIsSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Generate avatar fallback from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      {/* Top bar with announcement */}
      <div className="bg-brand-teal text-white py-2 text-center text-sm">
        Free shipping on orders over $50 | 30-day free returns
      </div>
      
      {/* Main navbar */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Mobile menu toggle */}
        <button 
          className="md:hidden flex items-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-brand-black flex items-center">
          <span className="bg-brand-teal text-white px-2 py-1 rounded mr-1">S</span>
          <span>ShopHub</span>
        </Link>
        
        {/* Desktop Navigation Menu */}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              {categories.map((category) => (
                <NavigationMenuItem key={category.id}>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-transparent">
                    {category.name}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[600px] p-4 md:w-[800px]">
                      <div className="grid grid-cols-3 gap-6">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.id} className="space-y-3">
                            <NavigationMenuLink asChild>
                              <Link
                                to={`/products/${category.slug}/${subcategory.slug}`}
                                className="block text-lg font-medium text-brand-teal hover:underline"
                              >
                                {subcategory.name}
                              </Link>
                            </NavigationMenuLink>
                            <ul className="space-y-2 text-sm">
                              <li>
                                <Link 
                                  to={`/products/${category.slug}/${subcategory.slug}/bestsellers`}
                                  className="text-gray-600 hover:text-brand-teal"
                                >
                                  Bestsellers
                                </Link>
                              </li>
                              <li>
                                <Link 
                                  to={`/products/${category.slug}/${subcategory.slug}/new-arrivals`}
                                  className="text-gray-600 hover:text-brand-teal"
                                >
                                  New Arrivals
                                </Link>
                              </li>
                              <li>
                                <Link 
                                  to={`/products/${category.slug}/${subcategory.slug}/deals`}
                                  className="text-gray-600 hover:text-brand-teal"
                                >
                                  Special Offers
                                </Link>
                              </li>
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <Link to="/deals" className="text-brand-teal font-medium px-4 py-2 block">
                  Deals
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Desktop Search */}
        <div className="hidden md:block relative" ref={searchRef}>
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search products..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Popular Searches">
                    {popularSearches.map((term) => (
                      <CommandItem 
                        key={term} 
                        onSelect={() => handleSearch(term)}
                      >
                        {term}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* User actions */}
        <div className="flex items-center space-x-4">
          {/* Currency Selector */}
          <div className="hidden md:block">
            <CurrencySelector />
          </div>
          
          <Link to="/wishlist" className="hidden md:block relative">
            <Heart className="h-5 w-5" />
            {savedItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {savedItemsCount > 99 ? '99+' : savedItemsCount}
              </span>
            )}
          </Link>
          
          {/* User account dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account?tab=orders" className="cursor-pointer">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>Orders</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account?tab=wishlist" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Saved Items</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="hidden md:flex items-center">
              <User className="h-5 w-5" />
            </Link>
          )}
          
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-teal text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <nav>
              <ul className="space-y-4">
                {categories.map((category) => (
                  <li key={category.id} className="py-2 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <Link 
                        to={`/products/${category.slug}`}
                        className="font-medium text-gray-800"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    </div>
                  </li>
                ))}
                <li className="py-2 border-b border-gray-100">
                  <Link 
                    to="/deals" 
                    className="font-medium text-brand-teal"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Deals
                  </Link>
                </li>
                
                {/* Mobile account links */}
                {user ? (
                  <>
                    <li className="py-2 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </li>
                    <li className="py-2 border-b border-gray-100">
                      <Link 
                        to="/account" 
                        className="flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <UserCircle className="h-4 w-4 mr-2" />
                        <span>My Account</span>
                      </Link>
                    </li>
                    <li className="py-2 border-b border-gray-100">
                      <Link 
                        to="/account?tab=orders" 
                        className="flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        <span>My Orders</span>
                      </Link>
                    </li>
                    <li className="py-2 border-b border-gray-100">
                      <Link 
                        to="/account?tab=wishlist" 
                        className="flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        <span>Saved Items</span>
                      </Link>
                    </li>
                    <li className="py-2">
                      <button 
                        className="flex items-center text-red-500"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Logout</span>
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="py-2 border-b border-gray-100">
                      <Link 
                        to="/login" 
                        className="flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        <span>Login</span>
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link 
                        to="/register" 
                        className="flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <UserCircle className="h-4 w-4 mr-2" />
                        <span>Create Account</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </div>
      )}
      
      {/* Mobile search - only visible on small screens */}
      <div className="md:hidden container mx-auto px-4 pb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Button
            className="absolute right-1 top-1 h-8 bg-brand-teal text-white rounded-full px-3"
            onClick={() => handleSearch(searchTerm)}
          >
            Go
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
