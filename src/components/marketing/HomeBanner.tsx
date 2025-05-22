import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BannerItem {
  id: string;
  image: string;
  mobileImage?: string;
  alt: string;
  link: string;
}

export const HomeBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Mock banner data - in a real app, this would come from an API
  const banners: BannerItem[] = [
    {
      id: '1',
      image: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/4cd6461f1c3faf16.jpg',
      mobileImage: 'https://rukminim1.flixcart.com/fk-p-flap/480/270/image/4cd6461f1c3faf16.jpg',
      alt: 'Electronics Sale',
      link: '/offers/electronics'
    },
    {
      id: '2',
      image: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/50c23c9bd60ea416.jpg',
      mobileImage: 'https://rukminim1.flixcart.com/fk-p-flap/480/270/image/50c23c9bd60ea416.jpg',
      alt: 'Fashion Sale',
      link: '/offers/fashion'
    },
    {
      id: '3',
      image: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/a1d93b6bc446790d.jpg',
      mobileImage: 'https://rukminim1.flixcart.com/fk-p-flap/480/270/image/a1d93b6bc446790d.jpg',
      alt: 'Home Appliances',
      link: '/offers/appliances'
    },
    {
      id: '4',
      image: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/8a89ee09acc1a9e5.jpg',
      mobileImage: 'https://rukminim1.flixcart.com/fk-p-flap/480/270/image/8a89ee09acc1a9e5.jpg',
      alt: 'Mobile Phones',
      link: '/offers/mobiles'
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 5 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // Handle touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      nextSlide();
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right
      prevSlide();
    }
  };

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoPlaying) {
      interval = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, nextSlide]);

  return (
    <div className="relative w-full overflow-hidden bg-flipkart-gray-background">
      <div 
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full">
            <Link to={banner.link}>
              <picture>
                <source media="(max-width: 768px)" srcSet={banner.mobileImage || banner.image} />
                <img 
                  src={banner.image} 
                  alt={banner.alt} 
                  className="w-full object-cover"
                  loading={banner.id === '1' ? 'eager' : 'lazy'}
                />
              </picture>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md z-10 focus:outline-none"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-flipkart-gray-primary-text" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md z-10 focus:outline-none"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-flipkart-gray-primary-text" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentSlide === index ? 'bg-flipkart-blue' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}; 