// src/components/RelatedProduct.jsx
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { getRelatedProducts } from "../services/userService";
import { Skeleton } from "./ui/skeleton";

export default function RelatedProduct({ categoryName = "makanan" }) {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert category name to URL format (spaces to hyphens)
        const categorySlug = categoryName.toLowerCase().replace(/\s+/g, "-");

        // Fetch more products with pagination
        const response = await getRelatedProducts(categorySlug, 0, 20);
        setProducts(response.products || []);
      } catch (err) {
        console.error("Error fetching related products:", err);
        setError("Failed to load related products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryName]);

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
    <div className="mt-10 w-full bg-[#]">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Dapat Dibeli Bersamaan
        </h2>
      </div>

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
          {isLoading ? (
            // Skeleton loading for related products (more cards for better UX)
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-64">
                <Skeleton className="h-48 w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : error ? (
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
                No related products available
              </p>
            </div>
          )}
        </div>

        {/* Lihat Semua - Only show if more than 8 products */}
        {!isLoading && products.length >= 8 && (
          <div className="mt-4 text-left">
            <button className="px-4 py-2 bg-white text-[#2596be] font-medium rounded-lg shadow hover:bg-gray-100 select-none">
              Lihat Semua
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
