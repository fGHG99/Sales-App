// src/components/TrendingProducts.jsx
"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const trendingProducts = [
  { id: 1, name: "Indomie Goreng", price: "Rp 3.500", img: "/assets/indomie.png" },
  { id: 2, name: "Teh Botol Sosro", price: "Rp 5.000", img: "/assets/tehbotol.png" },
  { id: 3, name: "Beras 5kg", price: "Rp 65.000", img: "/assets/beras.png" },
  { id: 4, name: "Minyak Goreng 1L", price: "Rp 20.000", img: "/assets/minyak.png" },
  { id: 5, name: "Kopi Kapal Api", price: "Rp 15.000", img: "/assets/kopi.png" },
  { id: 6, name: "Aqua 1.5L", price: "Rp 7.000", img: "/assets/aqua.png" },
  { id: 7, name: "SilverQueen Coklat", price: "Rp 25.000", img: "/assets/coklat.png" },
  { id: 8, name: "Tango Wafer", price: "Rp 12.000", img: "/assets/wafer.png" },
  { id: 9, name: "Fresh Milk", price: "Rp 18.000", img: "/assets/milk.png" },
  { id: 10, name: "Sampoerna Mild", price: "Rp 27.000", img: "/assets/sampoerna.png" },
]

export default function TrendingProducts() {
  const scrollRef = useRef(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 0)
    setShowRight(scrollLeft + clientWidth < scrollWidth - 1)
  }

  useEffect(() => {
    checkScroll()
    const scrollContainer = scrollRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScroll)
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScroll)
      }
    }
  }, [])

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    const scrollAmount = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth
    scrollRef.current.scrollTo({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <div className="mt-10 relative w-full bg-[#FFF9AF] py-10">
      {/* Section Title */}
      <h2 className="text-xl font-bold mb-6 px-6">🔥 Sedang Trend</h2>

      {/* Left Button */}
      {showLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full shadow-md p-2"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {/* Scrollable Product List */}
      <div className="overflow-x-hidden px-6">
        <div
          ref={scrollRef}
          className="flex space-x-4 transition-transform duration-500 ease-in-out"
        >
          {trendingProducts.map((product) => (
            <div
              key={product.id}
              className="relative min-w-[140px] md:min-w-[160px] lg:min-w-[180px] 
              h-[260px] md:h-[300px] flex-shrink-0 bg-white rounded-lg shadow-md p-4 cursor-pointer 
              transition-all duration-300 hover:scale-105 hover:shadow-xl hover:z-10"
            >
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-36 object-contain mb-2"
              />
              <h3 className="text-sm font-semibold line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm text-primary font-bold mt-1">{product.price}</p>
              <button
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 rounded-[20px] transition-colors"
              >
                + Tambah
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Button */}
      {showRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full shadow-md p-2"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      )}
    </div>
  )
}
