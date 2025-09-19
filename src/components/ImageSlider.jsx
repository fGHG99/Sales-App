import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ImageSlider = ({ images, autoSlideInterval = 3000 }) => {
  // state (currentIndex menggunakan extended indexing: 1..N)
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  // refs untuk menyimpan nilai yang stabil di RAF loop
  const sliderRef = useRef(null);
  const rafIdRef = useRef(null);
  const startRef = useRef(null); // timestamp awal slide berjalan
  const elapsedRef = useRef(0); // elapsed ms pada slide saat ini
  const currentIndexRef = useRef(currentIndex);
  const isTransitioningRef = useRef(isTransitioning);
  const isHoveredRef = useRef(isHovered);
  const autoIntervalRef = useRef(autoSlideInterval);

  // extended images untuk seamless loop (clone last & first)
  const extendedImages =
    images && images.length > 0
      ? [images[images.length - 1], ...images, images[0]]
      : [];

  // sinkronisasi ref <-> state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);
  useEffect(() => {
    autoIntervalRef.current = autoSlideInterval;
  }, [autoSlideInterval]);

  // helper untuk memulai animasi ke index target (index di extended space)
  const animateToIndex = (toIndex) => {
    if (isTransitioningRef.current) return;
    // reset progress & elapsed
    elapsedRef.current = 0;
    startRef.current = null;
    setProgress(0);
    setIsTransitioning(true);
    setCurrentIndex(toIndex);
  };

  // manual controls
  const goToNext = () => {
    animateToIndex(currentIndexRef.current + 1);
  };
  const goToPrevious = () => {
    animateToIndex(currentIndexRef.current - 1);
  };
  const goToSlide = (index) => {
    // index = 0..(images.length-1) -> convert ke extended space (+1)
    animateToIndex(index + 1);
  };

  // RAF loop: handle progress & autoplay (runs continuously)
  useEffect(() => {
    if (!images || images.length <= 1) return; // nothing to autoplay

    const step = (timestamp) => {
      // jika transition sedang berlangsung, kita tetap request next frame
      // tapi tidak mengakumulasi elapsed untuk progress
      if (isTransitioningRef.current) {
        // pause progress accumulation during transition
        startRef.current = null;
        rafIdRef.current = requestAnimationFrame(step);
        return;
      }

      // normal (not hovered, not transitioning): accumulate elapsed
      if (!startRef.current) {
        // resume from previous elapsed
        startRef.current = timestamp - elapsedRef.current;
      }

      const elapsed = timestamp - startRef.current;
      elapsedRef.current = elapsed;

      const percent = Math.min((elapsed / autoIntervalRef.current) * 100, 100);
      // update state progress (causes re-render of progress bar)
      setProgress(percent);

      if (percent >= 100) {
        // reached interval -> trigger next slide
        // prepare for next slide: reset elapsed & start, then animate
        elapsedRef.current = 0;
        startRef.current = null;
        setProgress(0);
        // animate to next extended index
        animateToIndex(currentIndexRef.current + 1);
        // don't call requestAnimationFrame here; animateToIndex will cause transition,
        // RAF will continue and handle after transition
        rafIdRef.current = requestAnimationFrame(step);
        return;
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
    // we intentionally run this effect once (mount). refs keep values up-to-date.
  }, [images, autoSlideInterval]);

  // transitionend handler: handle clone jumps (seamless)
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const onTransitionEnd = (e) => {
      // ensure it's transform transition
      if (e.propertyName && e.propertyName !== "transform") return;

      // If we were on a clone, jump to real slide without animation
      if (currentIndexRef.current === 0) {
        // we moved to clone-of-last; jump to real last (images.length)
        setIsTransitioning(false); // disable transition (jump)
        setCurrentIndex(images.length); // images.length in extended space = real last
        // after setCurrentIndex, currentIndexRef will be updated in its effect
        return;
      }
      if (currentIndexRef.current === images.length + 1) {
        // moved to clone-of-first; jump to real first (1)
        setIsTransitioning(false);
        setCurrentIndex(1);
        return;
      }

      // otherwise normal slide finished
      setIsTransitioning(false);
    };

    el.addEventListener("transitionend", onTransitionEnd);
    return () => el.removeEventListener("transitionend", onTransitionEnd);
  }, [images]);

  // cleanup RAF on unmount (redundant because effect returns cleanup, but safe)
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // helpers for UI
  const getRealIndex = () => {
    if (!images || images.length === 0) return 0;
    if (currentIndex === 0) return images.length - 1;
    if (currentIndex === images.length + 1) return 0;
    return currentIndex - 1;
  };

  const getTransformValue = () => {
    return `translateX(-${currentIndex * 100}%)`;
  };

  // mouse enter/leave handlers: pause/resume without resetting progress
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // initial guard
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        No images available
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-96 overflow-hidden rounded-xl shadow-2xl group select-none bg-gray-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Images */}
      <div
        ref={sliderRef}
        className={`flex h-full ${
          isTransitioning ? "transition-transform duration-500 ease-in-out" : ""
        }`}
        style={{ transform: getTransformValue() }}
      >
        {extendedImages.map((image, idx) => (
          <div key={`ext-${idx}`} className="w-full h-full flex-shrink-0">
            <img
              src={image.url}
              alt={image.alt || `Slide ${idx}`}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <div
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10 ${
              isHovered
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2"
            }`}
          >
            <button
              onClick={goToPrevious}
              disabled={isTransitioning}
              className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          <div
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10 ${
              isHovered
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-2"
            }`}
          >
            <button
              onClick={goToNext}
              disabled={isTransitioning}
              className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-6 flex space-x-2 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              disabled={isTransitioning}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                getRealIndex() === idx
                  ? "bg-white scale-110 shadow-lg"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-white transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
