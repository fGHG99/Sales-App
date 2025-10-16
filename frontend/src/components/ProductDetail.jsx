import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, ImageOff } from "lucide-react";
import { getProductById } from "../services/userService";
import RelatedProduct from "./RelatedProduct";
import { Skeleton } from "./ui/skeleton";

const ProductDetail = () => {
  const { productId } = useParams();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product detail
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getProductById(productId);
        setProduct(response.product);
      } catch (err) {
        console.error("Error fetching product detail:", err);
        setError("Failed to load product detail");
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              <Skeleton className="h-4 w-32" />
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image Skeleton */}
            <div className="space-y-4">
              <Skeleton className="aspect-square bg-white rounded-2xl shadow-lg" />
            </div>

            {/* Product Information Skeleton */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error ? "Error Loading Product" : "Product Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The product you're looking for doesn't exist."}
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
  const productDescription = product.description || "No description available";
  const isLongDescription = productDescription.length > 150;
  const displayDescription =
    isDescriptionExpanded || !isLongDescription
      ? productDescription
      : productDescription.substring(0, 150) + "...";

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
              {product.name || "Product"}
            </span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              {product.images?.[0]?.url ? (
                <img
                  src={`${import.meta.env.VITE_BE_API_URL}${
                    product.images[0].url
                  }`}
                  alt={product.images?.[0]?.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageOff size={120} className="text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Badge and Category */}
            <div className="flex items-center space-x-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {product.category?.name || "Uncategorized"}
              </span>
              {product.isActive && (
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  Available
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
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(product.sellingPrice || 0)}
              </span>
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
                  disabled={!product.isActive}
                  className={`flex-1 flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
                    product.isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  {product.isActive
                    ? `Add to Cart - ${new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format((product.sellingPrice || 0) * quantity)}`
                    : "Out of Stock"}
                </button>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4"></div>
          </div>
        </div>
        <RelatedProduct categoryName={product.category?.name || "makanan"} />
      </main>
    </div>
  );
};

export default ProductDetail;
