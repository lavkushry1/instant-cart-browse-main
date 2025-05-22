import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from '../helpers/ScrollToTop';
import CategoryNavigation from './CategoryNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <CategoryNavigation />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}; 