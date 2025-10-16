// src/components/NewProduct.jsx
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { getNewProducts } from "../services/userService";
import { Skeleton } from "./ui/skeleton";

const NewProduct = () => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch new products
  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getNewProducts();
        setProducts(response.products || []);
      } catch (err) {
        console.error("Error fetching new products:", err);
        setError("Failed to load new products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewProducts();
  }, []);

  const handleNavigate = () => {
    navigate("/category/new");
  };

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

  // Don't render if loading and no products
  if (isLoading && products.length === 0) {
    return (
      <div className="w-full py-8">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/assets/New_product_icon.png"
            alt="New Product Icon"
            className="w-10 h-10"
          />
          <h2 className="text-2xl font-extrabold text-gray-900">
            Produk Baru Ditambahkan
          </h2>
        </div>
        <div className="px-6">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-64">
                <Skeleton className="h-48 w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no products and not loading
  if (!isLoading && products.length === 0) {
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
          {error ? (
            // Error state
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-gray-500 text-center">
                {error}
                <br />
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:text-blue-700 underline mt-2"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : products.length > 0 ? (
            // Render products
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            // No products state
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-gray-500 text-center">
                No new products available
              </p>
            </div>
          )}
        </div>

        {/* Lihat Semua - Only show if more than 5 products */}
        {!isLoading && products.length >= 5 && (
          <div className="mt-4 text-left">
            <button
              className="px-4 py-2 bg-white text-[#2596be] font-medium rounded-lg shadow hover:bg-gray-100 select-none"
              onClick={handleNavigate}
            >
              Lihat Semua
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProduct;
