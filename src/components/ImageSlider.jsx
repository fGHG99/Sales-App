import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageSlider = ({ images, autoSlideInterval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sliderRef = useRef(null);

  // Auto slide functionality
  useEffect(() => {
    if (!isHovered && images.length > 1) {
      const interval = setInterval(() => {
        goToNext();
      }, autoSlideInterval);

      return () => clearInterval(interval);
    }
  }, [isHovered, images.length, autoSlideInterval]);

  const goToNext = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    if (currentIndex === images.length - 1) {
      setCurrentIndex(currentIndex + 1); 
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 700);
    } else {
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => setIsTransitioning(false), 700);
    }
  };

  const goToPrevious = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    if (currentIndex === 0) {
      setCurrentIndex(-1);
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(images.length - 1);
      }, 700);
    } else {
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => setIsTransitioning(false), 700);
    }
  };

  const goToSlide = (index) => {
    if (isTransitioning) return;
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return <div className="w-full h-96 bg-gray-200 flex items-center justify-center">No images available</div>;
  }

  // Extended array for seamless looping
  const extendedImages = [
    images[images.length - 1],
    ...images,
    images[0]
  ];

  // Display index
  const displayIndex =
    currentIndex < 0 ? images.length :
    currentIndex >= images.length ? 1 :
    currentIndex + 1;

  // Transform (tanpa drag offset)
  const getTransformValue = () => {
    let baseTransform;
    if (currentIndex < 0) baseTransform = 0;
    else if (currentIndex >= images.length) baseTransform = (images.length + 1) * 100;
    else baseTransform = (currentIndex + 1) * 100;

    return `translateX(-${baseTransform}%)`;
  };

  return (
    <div
      className="relative w-full h-96 overflow-hidden rounded-xl shadow-2xl group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div 
        ref={sliderRef}
        className={`flex h-full ${
          isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''
        }`}
        style={{ transform: getTransformValue() }}
      >
        {extendedImages.map((image, index) => (
          <div key={`extended-${index}`} className="w-full h-full flex-shrink-0">
            <img
              src={image.url}
              alt={image.alt || `Slide ${index}`}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <div 
        className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
        }`}
      >
        <button
          onClick={goToPrevious}
          className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 backdrop-blur-sm"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div 
        className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <button
          onClick={goToNext}
          className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 backdrop-blur-sm"
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-6 flex space-x-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 transform hover:scale-125 ${
              (currentIndex === index || 
               (currentIndex < 0 && index === images.length - 1) ||
               (currentIndex >= images.length && index === 0))
                ? 'bg-white scale-110 shadow-lg'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-300 ease-linear"
          style={{ 
            width: `${(displayIndex / images.length) * 100}%`,
            transition: isHovered ? 'none' : 'width 300ms ease-linear'
          }}
        />
      </div>
    </div>
  );
};

export default ImageSlider;
