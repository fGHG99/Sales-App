// src/components/TrendingProducts.jsx
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

export const trendingProducts = [
  {
    id: 1,
    name: "Indomie Goreng Reng Goreng 200mg asjdansjdnasjdnajsdnajndjasndjandj",
    price: 3500,
    img: "/assets/20130807_1.jpg",
  },
  {
    id: 2,
    name: "Teh Botol Sosro",
    price: 5000,
    img: "/assets/20130807_1.jpg",
  },
  { id: 3, name: "Beras 5kg", price: 65000, img: "/assets/20130807_1.jpg" },
  {
    id: 4,
    name: "Minyak Goreng 1L",
    price: 20000,
    img: "/assets/20130807_1.jpg",
  },
  {
    id: 5,
    name: "Kopi Kapal Api",
    price: 15000,
    img: "/assets/20130807_1.jpg",
  },
  { id: 6, name: "Aqua 1.5L", price: 7000, img: "/assets/20130807_1.jpg" },
  {
    id: 7,
    name: "SilverQueen Coklat",
    price: 25000,
    img: "/assets/20130807_1.jpg",
  },
  { id: 8, name: "Tango Wafer", price: 12000, img: "/assets/20130807_1.jpg" },
  { id: 9, name: "Fresh Milk", price: 18000, img: "/assets/20130807_1.jpg" },
  {
    id: 10,
    name: "Sampoerna Mild",
    price: 27000,
    img: "/assets/20130807_1.jpg",
  },
];

export default function TrendingProducts() {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = (direction) => {
    const container = scrollRef.current;
    const scrollAmount = 300;

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2; // multiplier for speed
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="mt-10 w-full py-10">
      {/* Section Title */}
      <h2 className="text-xl font-bold mb-6 px-6 select-none">
        🔥 Sedang Trend
      </h2>

      {/* Product Grid with Scroll */}
      <div className="px-6 relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Container with Drag Support */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-visible pb-4 px-2"
        >
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
