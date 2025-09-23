import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { mockProducts } from "../utils/mockDataProduct";

// Debounce + Throttle Hook
const useDebouncedThrottle = (value, delay = 400, throttleDelay = 800) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      const now = Date.now();
      if (now - lastRan.current >= throttleDelay) {
        setDebouncedValue(value);
        lastRan.current = now;
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay, throttleDelay]);

  return debouncedValue;
};

//use garbage cleanup later !IMPORTANT!
export default function SearchBar({ searchQuery, setSearchQuery, onSelect }) {
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const debouncedQuery = useDebouncedThrottle(searchQuery);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Simulate search on mock data
    const filtered = mockProducts.filter((p) =>
      p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
    setResults(filtered);
    setShowDropdown(true);
  }, [debouncedQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (product) => {
    setSearchQuery(product.name);
    setShowDropdown(false);
    if (onSelect) onSelect(product); // parent can navigate if needed
  };

  return (
    <div className="relative flex-1 max-w-2xl" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim()) {
              setShowDropdown(true);
            }
          }}
          placeholder="Cari Barang"
          className="w-full pl-4 pr-10 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 font-inter text-sm"
        />
        {/* this search icon when clicked need to trigger search to get product that have the provided keyword, for example when user search "susu", it will also
        fetch "susu coklat dancow" etc !IMPORTANT */}
        {results.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* 🔹 Expand dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
            >
              {item.name}
            </div>
          ))}
        </div>
      )}

      {/* 🔹 No results */}
      {showDropdown && results.length === 0 && debouncedQuery.trim() && (
        <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-2 text-sm text-gray-500">
          Tidak ada produk dengan nama "{debouncedQuery}"
        </div>
      )}
    </div>
  );
}
