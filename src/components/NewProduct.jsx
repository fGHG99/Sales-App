// src/components/NewProduct.jsx
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NewProduct = ({ products }) => {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // cek posisi scroll
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollWidth > el.clientWidth + el.scrollLeft);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
    };
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 250; // geser per klik
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  // ambil hanya produk 1 minggu terakhir
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentProducts = products
    .filter((p) => new Date(p.createdAt) >= oneWeekAgo)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="w-full bg-[#2596be] py-6 relative">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-white text-xl font-semibold mb-4">Produk Baru</h2>

        <div className="relative">
          {/* tombol kiri */}
          {showLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow"
            >
              <ChevronLeft className="w-5 h-5 text-[#2596be]" />
            </button>
          )}

          {/* wrapper scroll */}
          <div
            ref={scrollRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {recentProducts.map((product, idx) => (
              <div
                key={idx}
                className="relative min-w-[140px] md:min-w-[160px] lg:min-w-[180px] h-[260px] md:h-[300px] bg-white rounded-xl shadow flex flex-col items-center justify-center p-4"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-md mb-2"
                />
                <h3 className="text-sm font-medium text-gray-800 truncate">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm">{product.price}</p>
              </div>
            ))}
          </div>

          {/* tombol kanan */}
          {showRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow"
            >
              <ChevronRight className="w-5 h-5 text-[#2596be]" />
            </button>
          )}
        </div>

        {/* tombol lihat semua */}
        {recentProducts.length > 10 && (
          <div className="mt-4 text-center">
            <button className="px-4 py-2 bg-white text-[#2596be] font-medium rounded-lg shadow hover:bg-gray-100">
              Lihat Semua
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProduct;
