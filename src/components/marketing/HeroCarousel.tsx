import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

// Carousel images matching Flipkart's homepage carousel style
const CAROUSEL_IMAGES = [
  {
    id: 1,
    src: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/a2d45f82f7c5577e.jpg?q=20',
    alt: 'Big Saving Days Are Back',
    href: '/sale'
  },
  {
    id: 2,
    src: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/4010d71cc1711265.jpg?q=20',
    alt: 'Electronics Sale',
    href: '/electronics'
  },
  {
    id: 3,
    src: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/352e6f0f8034fab5.jpg?q=20',
    alt: 'Fashion Collection',
    href: '/fashion'
  },
  {
    id: 4,
    src: 'https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/5df65ad101e18a8d.jpg?q=20',
    alt: 'Home Appliances',
    href: '/appliances'
  },
];

// Carousel options
const OPTIONS: EmblaOptionsType = {
  align: 'center',
  loop: true,
  skipSnaps: false,
  duration: 300, // 300ms transition as per PRD
};

// Auto-rotation interval in milliseconds
const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds as per PRD

export const HeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  // Initialize and cleanup
  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  // Setup embla event listeners
  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('reInit', onInit);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  // Auto-rotation
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, AUTO_SCROLL_INTERVAL);

    // Stop autoplay on user interaction
    const stopAutoplay = () => {
      clearInterval(autoplay);
    };

    emblaApi.on('pointerDown', stopAutoplay);

    return () => {
      clearInterval(autoplay);
      if (emblaApi) {
        emblaApi.off('pointerDown', stopAutoplay);
      }
    };
  }, [emblaApi]);

  // Navigation handlers
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  return (
    <div className="relative overflow-hidden">
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {CAROUSEL_IMAGES.map((image) => (
            <div 
              key={image.id} 
              className="flex-[0_0_100%] min-w-0"
            >
              <a href={image.href} className="block w-full h-full">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-[300px] md:h-[400px] object-cover"
                />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button 
        variant="ghost" 
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full h-10 w-10 shadow-md text-black"
        onClick={scrollPrev}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full h-10 w-10 shadow-md text-black"
        onClick={scrollNext}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              index === selectedIndex 
                ? 'bg-flipkart-blue' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}; 