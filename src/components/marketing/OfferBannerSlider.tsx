import React, { useState, useEffect } from 'react';

interface Banner {
  id: string;
  imageUrl: string;
  altText: string;
  link?: string;
}

interface OfferBannerSliderProps {
  banners: Banner[];
  autoScroll?: boolean;
  scrollInterval?: number;
}

const OfferBannerSlider: React.FC<OfferBannerSliderProps> = ({
  banners,
  autoScroll = true,
  scrollInterval = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoScroll || banners.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, scrollInterval);

    return () => clearInterval(intervalId);
  }, [autoScroll, scrollInterval, banners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden p-3">
      <div
        className="flex transition-transform ease-in-out duration-500"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full flex-shrink-0">
            <a href={banner.link || '#'} target="_blank" rel="noopener noreferrer">
              <img
                src={banner.imageUrl}
                alt={banner.altText}
                className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-2xl shadow-md"
                loading="lazy"
              />
            </a>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity duration-150"
          >
            &#10094;
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity duration-150"
          >
            &#10095;
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full ${currentIndex === index ? 'bg-blue-500' : 'bg-gray-300'} hover:bg-blue-400 transition-colors duration-150`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OfferBannerSlider;
