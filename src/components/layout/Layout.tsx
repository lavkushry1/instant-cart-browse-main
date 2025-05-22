import { ReactNode, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './FooterNew';
import MobileFooterNav from '@/components/MobileFooterNav';
import { useLocation } from 'react-router-dom';
import { FloatingSupportButton } from '@/components/FloatingSupportButton';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to content link - accessibility feature */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:text-brand-teal focus:p-4 focus:m-4 focus:outline-brand-teal"
      >
        Skip to content
      </a>
      
      <Navbar />
      
      <main id="main-content" className="flex-grow pt-[160px] md:pt-[142px] pb-20 md:pb-8" tabIndex={-1}>
        {children}
      </main>
      
      <Footer />
      
      {/* Mobile Footer Navigation */}
      <MobileFooterNav />
      
      {/* Floating Action Buttons */}
      <FloatingSupportButton />
      
      {/* Back to top button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 md:bottom-6 right-6 bg-brand-teal text-white rounded-full p-2 shadow-lg hover:bg-brand-dark transition-all z-40"
        aria-label="Back to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default Layout;
