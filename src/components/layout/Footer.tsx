import { Link } from 'react-router-dom';
import { CurrencySelector } from '@/components/currency/CurrencySelector';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Shop',
      links: [
        { name: 'All Products', path: '/products' },
        { name: 'Deals', path: '/deals' },
        { name: 'New Arrivals', path: '/products/new' },
        { name: 'Best Sellers', path: '/products/best-sellers' },
      ]
    },
    {
      title: 'Customer Service',
      links: [
        { name: 'Contact Us', path: '/contact' },
        { name: 'FAQs', path: '/faq' },
        { name: 'Shipping & Returns', path: '/shipping' },
        { name: 'Track Order', path: '/track-order' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', path: '/about' },
        { name: 'Careers', path: '/careers' },
        { name: 'Blog', path: '/blog' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
      ]
    }
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo & Store Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block text-xl font-bold mb-4">
              Instant<span className="text-primary">Cart</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-xs">
              Fast, reliable e-commerce platform for all your shopping needs.
            </p>
            
            {/* Currency Selector */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Select Currency</p>
              <CurrencySelector position="footer" showLabel />
            </div>
          </div>

          {/* Footer Link Sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-t mt-8 pt-8">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} InstantCart. All rights reserved.
          </p>
          
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm4-9a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2zm.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm7.072 0l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 1.414zm-3.536-.05A.997.997 0 0112 16a.997.997 0 01-.964-.05.997.997 0 01-.964.05 1 1 0 11.964-1.9.997.997 0 01.964.05z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 5.897c-.75.33-1.5.577-2.333.66A4.4 4.4 0 0021.5 4.33c-.833.495-1.75.825-2.75 1.155C17.833 4.495 16.583 4 15.25 4c-2.75 0-4.833 2.063-4.833 4.542 0 .33 0 .66.083.99-4-.165-7.583-2.063-9.917-4.95-.417.66-.667 1.485-.667 2.31 0 1.65.833 3.135 2.167 3.96-.75 0-1.5-.165-2.167-.495v.066c0 2.31 1.667 4.208 3.917 4.62-.417.082-.833.165-1.25.165-.333 0-.583 0-.917-.082.667 1.98 2.5 3.3 4.667 3.3-1.667 1.32-3.833 2.145-6.167 2.145-.417 0-.75 0-1.167-.083 2.25 1.485 4.833 2.31 7.583 2.31 9.083 0 14-7.425 14-13.86 0-.165 0-.33 0-.495.917-.66 1.75-1.485 2.417-2.475z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-foreground">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
