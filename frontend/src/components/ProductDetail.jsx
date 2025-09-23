import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {ShoppingCart} from "lucide-react";
import { getProductBySlug } from "../utils/mockDataProduct";

const ProductDetail = () => {
  const { productname } = useParams();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const product = productname ? getProductBySlug(productname) : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    console.log("Added to cart:", product.name, "Quantity:", quantity);
    // Add to cart logic here
  };

  // Check if description is longer than 2 lines (approximately 150 characters)
  const isLongDescription = product.description.length > 150;
  const displayDescription =
    isDescriptionExpanded || !isLongDescription
      ? product.description
      : product.description.substring(0, 150) + "...";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Home
            </Link>
            <span className="text-gray-400">{">"}</span>
            <span className="text-gray-800 font-medium">
              {product?.name || "Product"}
            </span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Badge and Category */}
            <div className="flex items-center space-x-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.originalPrice && (
                <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )}
                  % OFF
                </span>
              )}
              {!product.inStock && (
                <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-gray-900">
                Rp {product.price.toLocaleString("id-ID")}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  Rp {product.originalPrice.toLocaleString("id-ID")}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {displayDescription}
              </p>
              {isLongDescription && (
                <button
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  {isDescriptionExpanded ? "Show Less" : "Read More"}
                </button>
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-6">
              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="text-lg font-medium text-gray-900">
                  Quantity:
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                    disabled={!product.inStock}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                    disabled={!product.inStock}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
                    product.inStock
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  {product.inStock
                    ? `Add to Cart - Rp ${(product.price * quantity).toLocaleString("id-ID")}`
                    : "Out of Stock"}
                </button>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
