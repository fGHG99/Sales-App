import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const CategoryFilter = ({
  categories,
  selectedCategories,
  onCategoryChange,
  onClearFilters,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobile = false,
  // Props for sort and price filters
  priceSort = "",
  minPrice = "",
  onSortChange = () => {},
  onPriceChange = () => {},
}) => {
  // Individual section collapse states
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isSortPriceOpen, setIsSortPriceOpen] = useState(true);

  // ✅ Get categoryName parameter from URL
  const { categoryName } = useParams();

  // ✅ Auto-set selected category from URL parameter
  useEffect(() => {
    if (categoryName && onCategoryChange) {
      // Convert URL parameter (with hyphens) back to proper category name (with spaces)
      const categoryDisplayName = categoryName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      console.log("🔍 Debug CategoryFilter:");
      console.log("URL categoryName:", categoryName);
      console.log("Converted categoryDisplayName:", categoryDisplayName);
      console.log("Available categories:", categories);
      console.log("Current selectedCategories:", selectedCategories);

      // Check if this category exists in the categories list
      if (categories && categories.includes(categoryDisplayName)) {
        // Only set if not already selected
        if (!selectedCategories.includes(categoryDisplayName)) {
          console.log("✅ Setting category:", categoryDisplayName);
          onCategoryChange(categoryDisplayName);
        } else {
          console.log("⚠️ Category already selected:", categoryDisplayName);
        }
      } else {
        console.log("❌ Category not found in list:", categoryDisplayName);
        console.log("Available categories:", categories);

        // ✅ Fallback: Try to find category with case-insensitive search
        const foundCategory = categories?.find(
          (cat) => cat.toLowerCase() === categoryDisplayName.toLowerCase()
        );

        if (foundCategory && !selectedCategories.includes(foundCategory)) {
          console.log(
            "✅ Found category with case-insensitive search:",
            foundCategory
          );
          onCategoryChange(foundCategory);
        } else {
          console.log(
            "❌ No matching category found even with case-insensitive search"
          );
        }
      }
    }
  }, [categoryName, categories, selectedCategories, onCategoryChange]);
  // Currency helper
  const formatCurrency = (value) => {
    if (!value) return "";
    const numValue = parseInt(value.replace(/\D/g, ""));
    return new Intl.NumberFormat("id-ID").format(numValue);
  };

  const handleMinPriceChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    onPriceChange(formatCurrency(value));
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedCategories.length > 0 || priceSort || minPrice;

  return (
    <div
      className={`${
        isMobile ? "w-full" : "w-64"
      } bg-white rounded-lg shadow-md transition-all duration-300`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-4">
        {/* Categories Section */}
        <div className="space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          >
            <h4 className="font-medium text-gray-900">Categories</h4>
            <button className="p-1 hover:bg-gray-100 rounded">
              {isCategoriesOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Categories Content */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isCategoriesOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-2">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => onCategoryChange(category)}
                      className="border-gray-300"
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="flex-1 cursor-pointer text-sm text-gray-700 font-normal"
                    >
                      {category}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-2">
                  No categories available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sort & Price Section */}
        <div className="space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => setIsSortPriceOpen(!isSortPriceOpen)}
          >
            <h4 className="font-medium text-gray-900">Sort & Price</h4>
            <button className="p-1 hover:bg-gray-100 rounded">
              {isSortPriceOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Sort & Price Content */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isSortPriceOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-4">
              {/* Sort */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Sort by Price
                </label>
                <div className="relative">
                  <select
                    value={priceSort}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <option value="">Choose sorting</option>
                    <option value="low-to-high">Low to High</option>
                    <option value="high-to-low">High to Low</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Min Price */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">Rp</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter minimum price"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-900">
                Active Filters:
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {category}
                    <button
                      onClick={() => onCategoryChange(category)}
                      className="ml-1.5 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {priceSort && (
                  <span className="inline-flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    {priceSort === "low-to-high" ? "Price ↑" : "Price ↓"}
                    <button
                      onClick={() => onSortChange("")}
                      className="ml-1.5 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minPrice && (
                  <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    Min: Rp {minPrice}
                    <button
                      onClick={() => onPriceChange("")}
                      className="ml-1.5 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryFilter;
