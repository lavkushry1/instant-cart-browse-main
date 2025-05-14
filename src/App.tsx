import { Toaster } from "@/components/ui/toast";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { ConsentProvider } from "./hooks/useConsent";
import { CurrencyProvider } from "./hooks/useCurrency";
import TrackingScriptManager from "./components/tracking/TrackingScriptManager";
import ConsentBanner from "./components/tracking/ConsentBanner";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import AdminProducts from "./pages/Admin/Products";
import ProductForm from "./pages/Admin/ProductForm";
import AdminOrders from "./pages/Admin/Orders";
import AdminDashboard from "./pages/Admin/Dashboard";
import SEOSettings from "./pages/Admin/SEOSettings";
import ThemeSettings from "./pages/Admin/ThemeSettings";
import TrackingSettings from "./pages/Admin/TrackingSettings";
import { lazy, Suspense } from "react";

// Use React.lazy to dynamically import the components with TS errors
const AdminCustomers = lazy(() => import("./pages/Admin/Customers"));
const AdminAnalytics = lazy(() => import("./pages/Admin/Analytics"));
const AdminSettings = lazy(() => import("./pages/Admin/Settings"));
const AdvancedAnalytics = lazy(() => import("./pages/Admin/AdvancedAnalytics"));
const CurrencySettings = lazy(() => import("./pages/Admin/CurrencySettings"));

// Loading fallback
const LoadingFallback = () => <div className="p-6">Loading...</div>;

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
                <TrackingScriptManager />
                <ConsentBanner />
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Customer Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:category" element={<Products />} />
                    <Route path="/product/:productId" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/deals" element={<Products />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/products/new" element={<ProductForm />} />
                    <Route path="/admin/products/edit/:productId" element={<ProductForm />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/advanced-analytics" element={<AdvancedAnalytics />} />
                    <Route path="/admin/currency" element={<CurrencySettings />} />
                    <Route path="/admin/seo" element={<SEOSettings />} />
                    <Route path="/admin/theme" element={<ThemeSettings />} />
                    <Route path="/admin/tracking" element={<TrackingSettings />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    
                    {/* Not Found */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </CurrencyProvider>
            </ConsentProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
