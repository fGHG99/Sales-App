// src/components/NewProduct.jsx
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

const NewProduct = ({ products }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Check scroll position
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    handleScroll();
  }, [products]);

  // Scroll with buttons
  const scroll = (direction) => {
    const container = scrollRef.current;
    const scrollAmount = 300;
    if (!container) return;

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Drag handlers
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
    const walk = (x - startX.current) * 1.2; // drag speed multiplier
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Function to get products with error handling
  const getRecentProducts = () => {
    if (!products || products.length === 0) {
      return [];
    }

    // Filter products within 1 week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentProducts = products
      .filter((p) => new Date(p.createdAt) >= oneWeekAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Error handler: If no products found within 1 week, return newest products
    if (recentProducts.length === 0) {
      console.log(
        "⚠️ No products found within 1 week, showing newest products instead"
      );

      // Return the 5 most recent products regardless of date
      return products
        .filter((p) => p.createdAt) // Ensure createdAt exists
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Limit to 5 newest products
    }

    return recentProducts;
  };

  const displayProducts = getRecentProducts();

  // Don't render if no products at all
  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8">
      {/* Section Title with fallback indicator */}
      <div className="flex items-center gap-3 mb-8">
        {/* Logo */}
        <img
          src="/assets/New_product_icon.png"
          alt="New Product Icon"
          className="w-10 h-10"
        />
        <h2 className="text-2xl font-extrabold text-gray-900">
          Produk Baru Ditambahkan
        </h2>
      </div>

      <div className="px-6 relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#2596be]" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[#2596be]" />
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
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Lihat Semua - Only show if more than 10 products */}
        {displayProducts.length >= 5 && (
          <div className="mt-4 text-left">
            <button className="px-4 py-2 bg-white text-[#2596be] font-medium rounded-lg shadow hover:bg-gray-100 select-none">
              Lihat Semua
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProduct;
