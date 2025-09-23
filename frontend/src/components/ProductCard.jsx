import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product, loading = false }) => {
  if (loading) {
    // Skeleton Loader
    return (
      <div className="bg-white rounded-2xl shadow-md flex-shrink-0 w-[170px] h-[420px] animate-pulse flex flex-col">
        {/* Skeleton Image */}
        <div className="aspect-square bg-gray-200"></div>
        {/* Skeleton Content */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="h-5 bg-gray-200 rounded mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-5"></div>
          <div className="h-10 bg-gray-200 rounded-md mt-auto"></div>
        </div>
      </div>
    );
  }

  // Generate product slug
  const productName = product.name.toLowerCase().replace(/\s+/g, "-");

  return (
    <div
      key={product.id}
      className="w-[200px] h-[200px] bg-white rounded-2xl shadow-lg cursor-pointer flex-shrink-0 w-[170px] h-[420px] flex flex-col hover:shadow-xl transition-shadow select-none"
    >
      {/* Product Image */}
      <div className="w-full h-[200px]">
        <Link
          to={`/p/${product.name.replace(/\s+/g, "-").toLowerCase()}`}
          onMouseDown={(e) => e.preventDefault()} // prevent drag highlighting
        >
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-full object-cover rounded-t-2xl pointer-events-none select-none"
            draggable={false} // prevent image dragging
          />
        </Link>
      </div>

      {/* Add to Cart Button */}
      <div className="px-2 pt-5">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 transition-colors flex items-center justify-center gap-1 select-none"
          style={{ borderRadius: "25px" }}
        >
          <span className="text-lg">＋</span>
          Tambah
        </button>
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-2 px-2 pt-2 pb-2 flex-grow">
        <Link to={`/p/${product.name.replace(/\s+/g, "-").toLowerCase()}`} onMouseDown={(e) => e.preventDefault()}>
          <h3
            className="text-m font-regular select-none line-clamp-2 min-h-[48px]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>

        {/* Price now right under product name */}
        <p className="text-base font-semibold select-none">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(product.price)}
        </p>

        {/* Spacer ensures button stays at the bottom */}
        <div className="flex-grow"></div>
      </div>
    </div>
  );
};

export default ProductCard;
