import { useState } from "react";
import { Link } from "react-router-dom";

const categories = [
  { title: "Makanan", img: "/assets/makanan_logo.png" },
  { title: "Minuman", img: "/assets/minuman_logo.png" },
  { title: "Dapur & Bahan Masakan", img: "/assets/dapur_logo.png" },
  { title: "Ibu & Anak", img: "/assets/ibu_logo.png" },
  { title: "Kebutuhan Rumah Tangga", img: "/assets/kebutuhan_rumah_logo.png" },
  // { title: "Lainnya", img: "/assets/more_logo.png" }, // ❌ Dihapus
];

export function CategoryGrid() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="mt-10 w-full">
      <div className="flex items-center gap-3 mb-8">
        {/* Logo kategori */}
        <img
          src="/assets/kategori_logo.png"
          alt="Kategori Logo"
          className="w-10 h-10"
        />
        <h2 className="text-2xl font-extrabold text-gray-900">
          Kategori Belanja
        </h2>
      </div>

      {/* Category Grid */}
      <div className="px-6 relative">
        <div
          className="
          grid gap-4 sm:gap-6
          grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
          place-items-center
        "
        >
          {categories.map((item, idx) => {
            const slug = item.title.toLowerCase().replace(/\s+/g, "-");

            return (
              <Link
                key={idx}
                to={`/category/${slug}`}
                className={`group cursor-pointer transition-all duration-300 ease-in-out
                  hover:shadow-lg hover:-translate-y-1 hover:scale-105
                  border border-[#b4b4b4] bg-white rounded-lg
                  w-full max-w-[160px]
                `}
                style={{
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="p-4 md:p-6 h-full flex flex-col min-h-[140px] md:min-h-[160px]">
                  {/* Title */}
                  <div className="mb-2 text-center">
                    <h3
                      className={`text-sm md:text-base font-semibold text-foreground
                        leading-tight line-clamp-2
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
                        className="object-contain drop-shadow-sm w-14 h-14 md:w-16 md:h-16 mx-auto"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
