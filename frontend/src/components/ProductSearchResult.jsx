import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "./ProductCard";
import api from "../utils/api";

const BE_URL = import.meta.env.VITE_BE_API_URL;

const ProductPageResult = () => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [priceSort, setPriceSort] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  // ✅ Get query string from URL (same as SearchPage)
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || ""; // <-- use "q" for consistency

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📦 Fetching products from inventory API...");

      const response = await api.get("/inventory");
      console.log("✅ Products fetched:", response.data);

      const { products: fetchedProducts } = response.data;

      // Transform products to match component format
      const transformedProducts = fetchedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice, // Keep original for ProductCard
        price: Number(product.sellingPrice), // For backward compatibility
        brand: product.category?.name || "Uncategorized",
        description: product.description,
        img: product.images?.[0]?.url
          ? `${BE_URL}${product.images[0].url}`
          : "/placeholder-product.png",
        category: product.category,
        images: product.images,
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
      setError(err.response?.data?.message || "Failed to load products");

      if (err.response?.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = "/auth/signin";
      }
    } finally {
      setLoading(false);
    }
  };

  // Unique brands
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map((p) => p.brand))];
    return uniqueBrands.sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // ✅ filter by search query
    if (query.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by brand
    if (selectedBrand) {
      filtered = filtered.filter((product) => product.brand === selectedBrand);
    }

    // Filter by min price
    if (minPrice) {
      const minPriceNum = parseInt(minPrice.replace(/\D/g, "")) || 0;
      filtered = filtered.filter((product) => product.price >= minPriceNum);
    }

    // Sort
    if (priceSort === "low-to-high") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (priceSort === "high-to-low") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, query, selectedBrand, priceSort, minPrice]);

  // Reset filters but keep query
  const clearFilters = () => {
    setSelectedBrand("");
    setPriceSort("");
    setMinPrice("");
  };

  // Currency helpers
  const formatCurrency = (value) => {
    if (!value) return "";
    const numValue = parseInt(value.replace(/\D/g, ""));
    return new Intl.NumberFormat("id-ID").format(numValue);
  };

  const handleMinPriceChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setMinPrice(formatCurrency(value));
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Filter className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Products
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Products {query && `for "${query}"`}
          </h1>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </button>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-4">
            {/* Brand */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
            >
              <option value="">Sort by Price</option>
              <option value="low-to-high">Low to High</option>
              <option value="high-to-low">High to Low</option>
            </select>

            {/* Min Price */}
            <input
              type="text"
              placeholder="Min Price"
              value={minPrice}
              onChange={handleMinPriceChange}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            />

            {/* Clear */}
            {(selectedBrand || priceSort || minPrice) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading
              ? "Loading..."
              : `${filteredProducts.length} products found`}
          </p>

          {/* Active filters */}
          {!loading && (selectedBrand || priceSort || minPrice) && (
            <div className="flex flex-wrap gap-2">
              {selectedBrand && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Brand: {selectedBrand}
                </span>
              )}
              {priceSort && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  Sort: {priceSort === "low-to-high" ? "Price ↑" : "Price ↓"}
                </span>
              )}
              {minPrice && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  Min: Rp {minPrice}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 lg:gap-12">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <ProductCard key={i} loading={true} />
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Filter className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPageResult;
