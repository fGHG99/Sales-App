import React from "react";

const ProductCard = ({ product, loading = false }) => {
    if (loading) {
        // Skeleton Loader
        return (
            <div className="bg-white rounded-2xl shadow-md p-6 flex-shrink-0 w-[200px] h-[400px] animate-pulse flex flex-col">
                {/* Skeleton Image */}
                <div className="h-44 bg-gray-200 rounded-md mb-4"></div>

                {/* Skeleton Circles */}
                <div className="flex justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                </div>

                {/* Skeleton Text */}
                <div className="h-5 bg-gray-200 rounded mb-3"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-5"></div>

                {/* Skeleton Button */}
                <div className="h-10 bg-gray-200 rounded-md mt-auto"></div>
            </div>
        );
    }

    return (
        <div
            key={product.id}
            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer flex-shrink-0 w-[200px] h-[400px] flex flex-col hover:shadow-xl transition-shadow select-none"
        >
            {/* Product Image (full rendering, no container restriction) */}
            <img
                src={product.img}
                alt={product.name}
                className="w-full h-auto max-h-[180px] object-contain mb-4 pointer-events-none select-none"
            />

            {/* Product Info Container */}
            <div className="mt-8 flex-grow flex flex-col">
                {/* Product Name with Tooltip */}
                <h3
                    className="text-base font-semibold mb-5 overflow-hidden text-ellipsis whitespace-nowrap select-none"
                    title={product.name}
                >
                    {product.name}
                </h3>

                {/* Price */}
                <p className="text-lg text-blue-600 font-bold mb-4 select-none">
                    {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                    }).format(product.price)}
                </p>
            </div>

            {/* Add to Cart Button */}
            <button className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-1 select-none">
                <span className="text-xl">＋</span> Tambah
            </button>
        </div>
    );
};

export default ProductCard;
