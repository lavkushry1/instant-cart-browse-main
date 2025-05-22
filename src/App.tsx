import { Toaster } from "./components/ui/toast";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./hooks/AuthProvider";
import { ThemeProvider } from "./hooks/ThemeProvider";
import { ConsentProvider } from "./hooks/ConsentProvider";
import { CurrencyProvider } from "./hooks/CurrencyProvider";
import { OfferProvider } from './contexts/OfferProvider';
import TrackingScriptManager from "./components/tracking/TrackingScriptManager";
import ConsentBanner from "./components/tracking/ConsentBanner";
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Suspense } from 'react';

// Page Imports
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import ForgotPassword from './pages/ForgotPassword';
import WishlistPage from './pages/WishlistPage';
import ProductListingPage from './pages/ProductListingPage'; // New PLP component
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

// Admin Pages (Consider lazy loading for these if not already)
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminProducts from "./pages/Admin/Products";
import ProductForm from "./pages/Admin/ProductForm";
import AdminOrders from "./pages/Admin/Orders";
import AdminOffersPage from "./pages/Admin/Offers";
import AdminCustomers from "./pages/Admin/Customers";
import AdminAnalytics from "./pages/Admin/Analytics";
import AdvancedAnalytics from "./pages/Admin/AdvancedAnalytics";
import CurrencySettings from "./pages/Admin/CurrencySettings";
import SEOSettings from "./pages/Admin/SEOSettings";
import ThemeSettings from "./pages/Admin/ThemeSettings";
import TrackingSettings from "./pages/Admin/TrackingSettings";
import AdminSettings from "./pages/Admin/Settings";
import AdminReviews from "./pages/Admin/Reviews"; // Import AdminReviews

// Suspense fallback
const LoadingFallback = () => <div className="p-6 text-center"><p>Loading page...</p></div>; 

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <ConsentProvider>
              <CurrencyProvider>
                <OfferProvider>
                  <TrackingScriptManager />
                  <ConsentBanner />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Customer Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:category" element={<Products />} />
                      <Route path="/product-listing/:category" element={<ProductListingPage />} /> {/* Route for new PLP */}
                      <Route path="/product-listing" element={<ProductListingPage />} /> {/* Generic PLP route */}
                      <Route path="/product/:productId" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route 
                        path="/account" 
                        element={<ProtectedRoute><Account /></ProtectedRoute>} 
                      />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/deals" element={<Products />} /> {/* Assuming /deals shows all products or a specific category */}
                      <Route 
                        path="/wishlist" 
                        element={<ProtectedRoute><WishlistPage /></ProtectedRoute>}
                      />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />
                      <Route path="/terms" element={<TermsAndConditionsPage />} />
                      <Route path="/order-tracking/:orderId" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
                      
                      {/* Admin Routes - Assuming AdminLayout handles auth protection for its children */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="products/new" element={<ProductForm />} />
                        <Route path="products/edit/:productId" element={<ProductForm />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="offers" element={<AdminOffersPage />} />
                        <Route path="customers" element={<AdminCustomers />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
                        <Route path="currency" element={<CurrencySettings />} />
                        <Route path="seo" element={<SEOSettings />} />
                        <Route path="theme" element={<ThemeSettings />} />
                        <Route path="tracking" element={<TrackingSettings />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="reviews" element={<AdminReviews />} /> 
                      </Route>
                      
                      {/* Not Found */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </OfferProvider>
              </CurrencyProvider>
            </ConsentProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
