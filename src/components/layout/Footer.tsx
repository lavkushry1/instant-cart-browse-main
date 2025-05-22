import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter, 
  Mail, 
  Phone, 
  HelpCircle,
  Gift,
  Truck,
  CreditCard,
  ShieldCheck,
  Package,
  RefreshCw,
  Star
} from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const aboutLinks = [
    { label: 'Contact Us', href: '/contact' },
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Flipkart Stories', href: '/stories' },
    { label: 'Press', href: '/press' },
    { label: 'Corporate Information', href: '/corporate-info' },
  ];
  
  const helpLinks = [
    { label: 'Payments', href: '/help/payments' },
    { label: 'Shipping', href: '/help/shipping' },
    { label: 'Cancellation & Returns', href: '/help/returns' },
    { label: 'FAQ', href: '/help/faq' },
    { label: 'Track Orders', href: '/track-order' },
  ];
  
  const policyLinks = [
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Security', href: '/security' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Sitemap', href: '/sitemap' },
    { label: 'EPR Compliance', href: '/epr-compliance' },
  ];

  const consumerLinks = [
    { label: 'Advertise', href: '/advertise' },
    { label: 'Gift Cards', href: '/gift-cards' },
    { label: 'Help Center', href: '/help-center' },
    { label: 'Become a Seller', href: '/seller' },
  ];
  
  const socialLinks = [
    { label: 'Facebook', icon: <Facebook size={18} />, href: 'https://facebook.com' },
    { label: 'Twitter', icon: <Twitter size={18} />, href: 'https://twitter.com' },
    { label: 'YouTube', icon: <Youtube size={18} />, href: 'https://youtube.com' },
    { label: 'Instagram', icon: <Instagram size={18} />, href: 'https://instagram.com' },
  ];

  return (
    <footer>
      {/* Top Features Section */}
      <div className="bg-white border-t border-flipkart-gray-border py-4">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Truck className="h-6 w-6 mr-3 text-flipkart-gray-secondary-text" />
              <div>
                <h4 className="text-flipkart-body font-medium">Free Delivery</h4>
                <p className="text-flipkart-small text-flipkart-gray-secondary-text">
                  On orders above ₹499
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <RefreshCw className="h-6 w-6 mr-3 text-flipkart-gray-secondary-text" />
              <div>
                <h4 className="text-flipkart-body font-medium">Easy Returns</h4>
                <p className="text-flipkart-small text-flipkart-gray-secondary-text">
                  10 day return policy
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <ShieldCheck className="h-6 w-6 mr-3 text-flipkart-gray-secondary-text" />
              <div>
                <h4 className="text-flipkart-body font-medium">Secure Payment</h4>
                <p className="text-flipkart-small text-flipkart-gray-secondary-text">
                  100% secure checkout
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Package className="h-6 w-6 mr-3 text-flipkart-gray-secondary-text" />
              <div>
                <h4 className="text-flipkart-body font-medium">Authentic Products</h4>
                <p className="text-flipkart-small text-flipkart-gray-secondary-text">
                  Sourced directly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-flipkart-dark text-white py-10">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* About & Help Section - 7 columns */}
            <div className="md:col-span-7 grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* About */}
              <div>
                <h3 className="text-[#878787] text-xs uppercase font-medium mb-3">ABOUT</h3>
                <ul className="space-y-2">
                  {aboutLinks.map((link) => (
                    <li key={link.label}>
                      <Link 
                        to={link.href} 
                        className="text-white text-xs hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Help */}
              <div>
                <h3 className="text-[#878787] text-xs uppercase font-medium mb-3">HELP</h3>
                <ul className="space-y-2">
                  {helpLinks.map((link) => (
                    <li key={link.label}>
                      <Link 
                        to={link.href} 
                        className="text-white text-xs hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Policy */}
              <div>
                <h3 className="text-[#878787] text-xs uppercase font-medium mb-3">POLICY</h3>
                <ul className="space-y-2">
                  {policyLinks.map((link) => (
                    <li key={link.label}>
                      <Link 
                        to={link.href} 
                        className="text-white text-xs hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Consumer */}
              <div>
                <h3 className="text-[#878787] text-xs uppercase font-medium mb-3">CONSUMER POLICY</h3>
                <ul className="space-y-2">
                  {consumerLinks.map((link) => (
                    <li key={link.label}>
                      <Link 
                        to={link.href} 
                        className="text-white text-xs hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <h3 className="text-[#878787] text-xs uppercase font-medium mb-3">PLUS</h3>
                  <Link to="/plus" className="flex items-center text-xs hover:underline">
                    <span>Flipkart Plus</span>
                    <img 
                      src="/flipkart-plus-icon.svg" 
                      alt="Plus" 
                      className="w-3 h-3 ml-1"
                    />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Vertical Line */}
            <div className="hidden md:block md:col-span-1 border-l border-gray-700 mx-auto h-full"></div>
            
            {/* Mail & Address - 4 columns */}
            <div className="md:col-span-4">
              <div className="mb-8">
                <h3 className="text-[#878787] text-xs uppercase font-medium mb-3">MAIL US</h3>
                <p className="text-white text-xs leading-5">
                  Flipkart Internet Private Limited,<br />
                  Buildings Alyssa, Begonia &<br />
                  Clove Embassy Tech Village,<br />
                  Outer Ring Road, Devarabeesanahalli Village,<br />
                  Bengaluru, 560103,<br />
                  Karnataka, India
                </p>
              </div>
              
              <div>
                <h3 className="text-[#878787] text-xs uppercase font-medium mb-3">REGISTERED OFFICE ADDRESS</h3>
                <p className="text-white text-xs leading-5">
                  Flipkart Internet Private Limited,<br />
                  Buildings Alyssa, Begonia &<br />
                  Clove Embassy Tech Village,<br />
                  Outer Ring Road, Devarabeesanahalli Village,<br />
                  Bengaluru, 560103,<br />
                  Karnataka, India<br />
                  CIN: U51109KA2012PTC066107<br />
                  Telephone: <a href="tel:18002089898" className="hover:underline">1800 208 9898</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Partners */}
      <div className="bg-[#172337] py-5 border-t border-gray-700">
        <div className="container px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <img src="/payment/visa.png" alt="Visa" className="h-6 mr-3" />
              <img src="/payment/mastercard.png" alt="Mastercard" className="h-6 mr-3" />
              <img src="/payment/paytm.png" alt="Paytm" className="h-6 mr-3" />
              <img src="/payment/rupay.png" alt="RuPay" className="h-6 mr-3" />
              <img src="/payment/upi.png" alt="UPI" className="h-6" />
            </div>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-flipkart-blue"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap justify-between items-center">
            <p className="text-xs text-[#878787]">
              &copy; 2007-{currentYear} Flipkart.com
            </p>
            <div className="flex items-center">
              <img 
                src="/images/flipkart-icon.png" 
                alt="Flipkart" 
                className="h-6 mr-2"
              />
              <p className="text-xs text-white">India's most trusted e-commerce platform</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
