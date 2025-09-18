"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const categories = [
  { title: "Makanan", img: "/assets/makanan_logo.png" },
  { title: "Minuman", img: "/assets/minuman_logo.png" },
  { title: "Dapur & Bahan Masakan", img: "/assets/dapur_logo.png" },
  { title: "Ibu & Anak", img: "/assets/ibu_logo.png" },
  { title: "Kebutuhan Rumah Tangga", img: "/assets/kebutuhan_rumah_logo.png" },
  { title: "Lainnya", img: "/assets/more_logo.png" },
]

export function CategoryGrid() {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const navigate = useNavigate()

  const handleClick = (title) => {
    if (title === "Lainnya") {
      navigate("/category")
    } else {
      const slug = title.toLowerCase().replace(/\s+/g, "-") // ubah jadi slug
      navigate(`/category/${slug}`)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
      {categories.map((item, idx) => (
        <div
          key={idx}
          onClick={() => handleClick(item.title)}
          className={`group cursor-pointer transition-all duration-300 ease-in-out
            hover:shadow-lg hover:-translate-y-1 hover:scale-105
            border border-[#b4b4b4] bg-[#ffffff] rounded-lg
          `}
          style={{
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", // drop shadow
          }}
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="p-4 md:p-6 h-full flex flex-col min-h-[160px] md:min-h-[180px]">
            {/* Title */}
            <div className="mb-2">
              <h3
                className={`text-lg md:text-xl font-bold text-foreground
                  leading-tight line-clamp-2 text-left
                  group-hover:text-primary transition-colors duration-200
                `}
                title={item.title}
              >
                {item.title}
              </h3>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center items-center">
              <div
                className={`transition-transform duration-300
                  ${hoveredIndex === idx ? "scale-110" : ""}
                `}
              >
                <img
                  src={item.img || "/placeholder.svg"}
                  alt={item.title}
                  className="object-contain drop-shadow-sm w-16 h-16 mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
