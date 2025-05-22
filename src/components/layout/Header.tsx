import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Heart,
  Gift,
  Bell,
  ArrowLeft,
  Home,
  PackageCheck,
  HelpCircle,
  Download,
  Star,
  Percent,
  Zap,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

export const Header = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  
  const cartItemsCount = cart?.length || 0;
  
  // Handle dropdown toggle
  const toggleLoginDropdown = () => setShowLoginDropdown(!showLoginDropdown);
  const toggleMoreDropdown = () => setShowMoreDropdown(!showMoreDropdown);
  const toggleMobileSearch = () => setShowMobileSearch(!showMobileSearch);
  
  // Close dropdowns when clicking outside
  const closeDropdowns = () => {
    setShowLoginDropdown(false);
    setShowMoreDropdown(false);
  };

  // Mobile navigation drawer links
  const mobileNavCategories = [
    { icon: '📱', name: 'Electronics', path: '/category/electronics' },
    { icon: '👕', name: 'Fashion', path: '/category/fashion' },
    { icon: '🏠', name: 'Home', path: '/category/home' },
    { icon: '🧸', name: 'Toys', path: '/category/toys' },
    { icon: '💄', name: 'Beauty', path: '/category/beauty' },
    { icon: '⚽', name: 'Sports', path: '/category/sports' },
    { icon: '🛒', name: 'Grocery', path: '/category/grocery' },
    { icon: '🧰', name: 'Appliances', path: '/category/appliances' },
  ];
  
  const mobileNavLinks = [
    { icon: <Home className="h-5 w-5" />, name: 'Home', path: '/' },
    { icon: <Zap className="h-5 w-5" />, name: 'SuperCoins', path: '/supercoins' },
    { icon: <Percent className="h-5 w-5" />, name: 'Offers & Coupons', path: '/offers' },
    { icon: <Bell className="h-5 w-5" />, name: 'Notifications', path: '/notifications', badge: '3' },
    { icon: <Headphones className="h-5 w-5" />, name: 'Customer Service', path: '/customer-service' },
    { icon: <Download className="h-5 w-5" />, name: 'Download App', path: '/download' },
  ];

  // Determine if back button should be shown based on current path
  useEffect(() => {
    // Show back button on product detail, category pages, cart, etc.
    const shouldShowBack = 
      location.pathname.includes('/product/') || 
      location.pathname.includes('/category/') || 
      location.pathname === '/cart' ||
      location.pathname === '/wishlist' ||
      location.pathname.includes('/account');
    
    setShowBackButton(shouldShowBack);
    
    // Close mobile search when navigating
    setShowMobileSearch(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 z-50 w-full shadow-md" style={{ height: '56px', backgroundColor: '#2874F0' }}>
      <div className="container h-full flex items-center px-4" onClick={closeDropdowns}>
        {/* Mobile Back Button - Shows conditionally */}
        {showBackButton && (
          <Button
            variant="ghost" 
            size="icon"
            className="md:hidden text-white mr-2 hover:bg-transparent"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {/* Mobile Menu Button */}
        {!showBackButton && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost" 
                size="icon"
                className="md:hidden text-white mr-2 hover:bg-transparent"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[320px] sm:max-w-sm">
              <SheetHeader className="h-14 bg-flipkart-blue p-4 border-b border-flipkart-blue flex items-center">
                {user ? (
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white mr-3">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <div>
                      <SheetTitle className="text-white text-left text-sm font-normal">
                        Hey, {user.displayName || 'User'}
                      </SheetTitle>
                      <div className="flex items-center">
                        <div className="text-xs text-white/80">Flipkart Plus Member</div>
                        <img 
                          src="/flipkart-plus-icon.svg" 
                          alt="Plus" 
                          className="w-3 h-3 ml-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <SheetTitle className="text-white text-left text-base font-medium">Welcome</SheetTitle>
                    <div className="flex space-x-2">
                      <Link 
                        to="/login" 
                        className="bg-white text-flipkart-blue px-3 py-1 text-sm font-medium rounded"
                      >
                        Login
                      </Link>
                      <Link 
                        to="/register" 
                        className="border border-white text-white px-3 py-1 text-sm font-medium rounded"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </SheetHeader>

              <div className="overflow-auto h-full pb-20">
                {/* SuperCoins Banner */}
                {user && (
                  <div className="p-4 bg-gradient-to-r from-[#ffe57f] to-[#ffd740] flex items-center justify-between">
                    <div>
                      <h4 className="text-flipkart-gray-primary-text font-medium">SuperCoin Balance</h4>
                      <div className="flex items-center">
                        <span className="font-medium text-flipkart-gray-primary-text">117</span>
                        <img 
                          src="/flipkart-plus-icon.svg" 
                          alt="SuperCoin" 
                          className="w-4 h-4 ml-1"
                        />
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="bg-white hover:bg-white/90 text-flipkart-gray-primary-text">
                      View Benefits
                    </Button>
                  </div>
                )}

                {/* Top Categories */}
                <div className="p-4">
                  <h3 className="text-flipkart-header-sm font-medium mb-3">Top Categories</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {mobileNavCategories.map(category => (
                      <SheetClose asChild key={category.path}>
                        <Link 
                          to={category.path}
                          className="flex flex-col items-center text-center gap-1"
                        >
                          <div className="w-12 h-12 rounded-full bg-flipkart-gray-background flex items-center justify-center">
                            <span className="text-xl">{category.icon}</span>
                          </div>
                          <span className="text-flipkart-small text-flipkart-gray-primary-text">
                            {category.name}
                          </span>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-flipkart-gray-border"></div>
                
                {/* Account Links */}
                <div className="p-4">
                  <h3 className="text-flipkart-header-sm font-medium mb-3">
                    {user ? 'Account' : 'Account & Orders'}
                  </h3>
                  <div className="space-y-4">
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Link to="/account" className="flex items-center">
                            <User className="h-5 w-5 mr-3 text-flipkart-gray-secondary-text" />
                            <span>My Profile</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/orders" className="flex items-center">
                            <PackageCheck className="h-5 w-5 mr-3 text-flipkart-gray-secondary-text" />
                            <span>My Orders</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/wishlist" className="flex items-center">
                            <Heart className="h-5 w-5 mr-3 text-flipkart-gray-secondary-text" />
                            <span>My Wishlist</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <button 
                            onClick={logout}
                            className="flex items-center w-full text-left"
                          >
                            <LogOut className="h-5 w-5 mr-3 text-flipkart-gray-secondary-text" />
                            <span>Logout</span>
                          </button>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Link to="/orders" className="flex items-center">
                            <PackageCheck className="h-5 w-5 mr-3 text-flipkart-gray-secondary-text" />
                            <span>Orders</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/wishlist" className="flex items-center">
                            <Heart className="h-5 w-5 mr-3 text-flipkart-gray-secondary-text" />
                            <span>Wishlist</span>
                          </Link>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-flipkart-gray-border"></div>
                
                {/* More Links */}
                <div className="p-4">
                  <div className="space-y-4">
                    {mobileNavLinks.map(link => (
                      <SheetClose asChild key={link.path}>
                        <Link to={link.path} className="flex items-center">
                          <span className="mr-3 text-flipkart-gray-secondary-text relative">
                            {link.icon}
                            {link.badge && (
                              <span className="absolute -top-1 -right-1 bg-flipkart-red text-white text-[10px] w-3 h-3 flex items-center justify-center rounded-full">
                                {link.badge}
                              </span>
                            )}
                          </span>
                          <span>{link.name}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
                
                {/* App download section */}
                <div className="border-t border-flipkart-gray-border p-4">
                  <div className="flex items-center justify-between bg-flipkart-gray-background p-3 rounded">
                    <div className="flex items-center">
                      <img 
                        src="/images/flipkart-icon.png" 
                        alt="Flipkart App" 
                        className="w-8 h-8 mr-3"
                      />
                      <div>
                        <h4 className="text-flipkart-body font-medium">Flipkart App</h4>
                        <p className="text-flipkart-small text-flipkart-gray-secondary-text">
                          Fast, secure shopping
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-flipkart-blue hover:bg-flipkart-blue/90">
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        {/* Logo */}
        <div className={`flex items-center flex-col ${!showBackButton ? 'ml-3' : ''}`}>
          <Link to="/" className={`text-white font-bold ${showMobileSearch ? 'hidden md:block' : ''}`}>
            <img src="/flipkart-logo.svg" alt="Flipkart" width="75" height="22" />
          </Link>
          <Link to="/plus" className="hidden md:flex items-center mt-0.5">
            <span className="text-[10px] italic text-white/80">Explore</span>
            <span className="text-[10px] italic font-medium text-flipkart-yellow ml-0.5">Plus</span>
            <img 
              src="/flipkart-plus-icon.svg" 
              alt="Plus" 
              className="w-3 h-3 ml-0.5"
            />
          </Link>
        </div>
        
        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 mx-auto px-4 max-w-[45%] min-w-[304px]">
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search for products, brands and more"
              className="w-full h-10 pl-4 pr-12 rounded-sm text-flipkart-body bg-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#717478] placeholder:text-flipkart-body shadow-none"
            />
            <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center cursor-pointer bg-white rounded-r-sm">
              <Search className="h-5 w-5 text-flipkart-blue" />
            </div>
          </div>
        </div>
        
        {/* Mobile Search - Expandable */}
        <div className={`md:hidden ${showMobileSearch ? 'flex flex-1' : 'hidden'}`}>
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search for products, brands and more"
              className="w-full h-9 pl-4 pr-10 rounded-sm text-flipkart-body bg-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#717478] placeholder:text-flipkart-body shadow-none"
              autoFocus={showMobileSearch}
            />
            <Button 
              variant="ghost"
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={toggleMobileSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Search Icon */}
        {!showMobileSearch && (
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden text-white ml-auto hover:bg-transparent"
            onClick={toggleMobileSearch}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        {/* Right Controls - Desktop */}
        <div className="hidden md:flex items-center ml-4">
          {/* Login Button/Dropdown */}
          <div className="relative mr-7" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              className="text-white font-medium text-flipkart-button hover:bg-transparent h-9 px-3"
              onClick={toggleLoginDropdown}
            >
              {user ? user.displayName || 'Account' : "Login"}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            
            {/* Login Dropdown */}
            {showLoginDropdown && (
              <div className="absolute top-full right-0 mt-0.5 w-60 bg-white rounded shadow-lg z-50">
                {!user ? (
                  <>
                    <div className="p-4 flex items-center justify-between border-b">
                      <p className="text-flipkart-body">New Customer?</p>
                      <Link 
                        to="/register" 
                        className="text-flipkart-blue text-flipkart-body font-medium"
                        onClick={closeDropdowns}
                      >
                        Sign Up
                      </Link>
                    </div>
                    <ul className="py-2">
                      <li className="border-b">
                        <Link 
                          to="/login" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <User className="h-4 w-4 mr-2 text-flipkart-blue" />
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/plus" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <span className="h-4 w-4 mr-2 relative">
                            <img 
                              src="/flipkart-plus-icon.svg" 
                              alt="Flipkart Plus"
                              className="h-4 w-4"
                            />
                          </span>
                          Flipkart Plus Zone
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/orders" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <PackageCheck className="h-4 w-4 mr-2 text-flipkart-blue" />
                          Orders
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/wishlist" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <Heart className="h-4 w-4 mr-2 text-flipkart-blue" />
                          Wishlist
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/rewards" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <Gift className="h-4 w-4 mr-2 text-flipkart-blue" />
                          Rewards
                        </Link>
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="p-4 border-b">
                      <div className="flex items-center">
                        <p className="text-flipkart-body font-medium">Welcome</p>
                        <div className="h-5 w-5 rounded-full bg-flipkart-blue flex items-center justify-center text-white text-xs ml-2">
                          {user.displayName?.[0] || user.email?.[0] || 'U'}
                        </div>
                      </div>
                      <p className="text-flipkart-small text-gray-500 mt-1">{user.email}</p>
                      {/* Flipkart Plus Member Badge */}
                      <div className="flex items-center mt-1 text-flipkart-small">
                        <div className="flex items-center bg-flipkart-blue/10 text-flipkart-blue rounded px-1.5 py-0.5">
                          <span>Flipkart Plus Member</span>
                          <img 
                            src="/flipkart-plus-icon.svg" 
                            alt="Plus" 
                            className="h-3 w-3 ml-1 text-flipkart-blue"
                          />
                        </div>
                      </div>
                    </div>
                    <ul className="py-2">
                      <li>
                        <Link 
                          to="/account" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <User className="h-4 w-4 mr-2 text-flipkart-blue" />
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/plus" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <img 
                            src="/flipkart-plus-icon.svg" 
                            alt="SuperCoin" 
                            className="h-4 w-4 mr-2"
                          />
                          Flipkart Plus (117 coins)
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/orders" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <PackageCheck className="h-4 w-4 mr-2 text-flipkart-blue" />
                          Orders
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/wishlist" 
                          className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={closeDropdowns}
                        >
                          <Heart className="h-4 w-4 mr-2 text-flipkart-blue" />
                          Wishlist
                        </Link>
                      </li>
                      <li>
                        <button 
                          className="w-full text-left px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                          onClick={() => {
                            logout();
                            closeDropdowns();
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2 text-flipkart-blue" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Become a Seller */}
          <div className="mr-7">
            <Link to="/seller" className="text-white text-flipkart-body font-medium">
              Become a Seller
            </Link>
          </div>
          
          {/* More Dropdown */}
          <div className="relative mr-7" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              className="text-white font-medium text-flipkart-body hover:bg-transparent h-9 px-3"
              onClick={toggleMoreDropdown}
            >
              More
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            
            {/* More Dropdown */}
            {showMoreDropdown && (
              <div className="absolute top-full right-0 mt-0.5 w-56 bg-white rounded shadow-lg z-50">
                <ul className="py-2">
                  <li>
                    <Link 
                      to="/notification-preferences" 
                      className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                      onClick={closeDropdowns}
                    >
                      <Bell className="h-4 w-4 mr-2 text-flipkart-blue" />
                      Notification Preferences
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/customer-care" 
                      className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                      onClick={closeDropdowns}
                    >
                      <Headphones className="h-4 w-4 mr-2 text-flipkart-blue" />
                      24x7 Customer Care
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/advertise" 
                      className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                      onClick={closeDropdowns}
                    >
                      <Zap className="h-4 w-4 mr-2 text-flipkart-blue" />
                      Advertise
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/download-app" 
                      className="px-4 py-2 flex items-center text-flipkart-body hover:bg-gray-50"
                      onClick={closeDropdowns}
                    >
                      <Download className="h-4 w-4 mr-2 text-flipkart-blue" />
                      Download App
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Cart - Visible on both desktop and mobile */}
        <div className={`${!showMobileSearch ? 'flex' : 'hidden md:flex'} mr-2 ml-auto md:ml-0`}>
          <Link to="/cart" className="flex items-center text-white">
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-flipkart-red text-white text-[10px] px-1 font-medium">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </div>
              )}
            </div>
            <span className="text-flipkart-small ml-1 hidden md:inline-block">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}; 