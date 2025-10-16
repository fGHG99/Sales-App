import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";
import api from "../utils/api";

const BE_URL = import.meta.env.VITE_BE_API_URL;

const CategoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  // All filter states
  const [priceSort, setPriceSort] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ✅ Get query string from URL (same as SearchPage)
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Handle active filter updates from CategoryFilter
  useEffect(() => {
    console.log("🔄 Selected categories updated:", selectedCategories);
  }, [selectedCategories]);

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
        sellingPrice: product.sellingPrice,
        price: Number(product.sellingPrice),
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
    } finally {
      setLoading(false);
    }
  };

  // Unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((p) => p.brand))];
    return uniqueCategories.sort();
  }, [products]);

  // Handle filter changes
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSortChange = (sort) => {
    setPriceSort(sort);
  };

  const handlePriceChange = (price) => {
    setMinPrice(price);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPriceSort("");
    setMinPrice("");
    setSelectedCategories([]);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // ✅ filter by search query
    if (query.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) =>
        selectedCategories.includes(product.brand)
      );
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
  }, [products, query, selectedCategories, priceSort, minPrice]);

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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Products {query && `for "${query}"`}
          </h1>

          {/* Product Count */}
          <p className="text-gray-600 mb-6">
            {loading
              ? "Loading..."
              : `Found ${filteredProducts.length} product${
                  filteredProducts.length !== 1 ? "s" : ""
                }`}
          </p>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Category Filter Sidebar */}
          <div className="lg:w-64 lg:flex-shrink-0">
            {/* Mobile Category Filter */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter Categories
              </button>
            </div>

            {/* Desktop Category Filter */}
            <div className="hidden lg:block mt-8">
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                onClearFilters={clearAllFilters}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isMobile={false}
                priceSort={priceSort}
                minPrice={minPrice}
                onSortChange={handleSortChange}
                onPriceChange={handlePriceChange}
              />
            </div>
          </div>

          {/* Product Results Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              {/* Active filters */}
              {!loading &&
                (priceSort || minPrice || selectedCategories.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        Category: {category}
                      </span>
                    ))}
                    {priceSort && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        Sort:{" "}
                        {priceSort === "low-to-high" ? "Price ↑" : "Price ↓"}
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

            {/* Products Grid - No wrapper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="transform scale-90 origin-center">
                    <ProductCard loading={true} />
                  </div>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <div key={p.id} className="transform scale-90 origin-center">
                    <ProductCard product={p} />
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <Filter className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your filters
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Category Filter Modal */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Category Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                onClearFilters={clearAllFilters}
                isSidebarOpen={true}
                setIsSidebarOpen={() => {}}
                isMobile={true}
                priceSort={priceSort}
                minPrice={minPrice}
                onSortChange={handleSortChange}
                onPriceChange={handlePriceChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
