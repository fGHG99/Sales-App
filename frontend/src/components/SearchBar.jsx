import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function SearchBar({ searchQuery, setSearchQuery, onSelect }) {
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebouncedThrottle(searchQuery);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    // Simulate search on mock data
    const filtered = mockProducts.filter((p) =>
      p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
    setResults(filtered);
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

  const addToHistory = (query) => {
    if (!query.trim()) return;
    setSearchHistory((prev) => {
      const newHistory = [query, ...prev.filter((item) => item !== query)];
      return newHistory.slice(0, 3); // keep only last 3
    });
  };

  const handleSelect = (product) => {
    setSearchQuery(product.name);
    setShowDropdown(false);
    addToHistory(product.name);
    if (onSelect) onSelect(product);
  };

  const handleSearch = (query) => {
    const searchTerm = (query && query.trim()) || debouncedQuery.trim();
    if (searchTerm) {
      addToHistory(searchTerm);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchQuery(searchTerm);
      setShowDropdown(false);
    }
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
          onFocus={() => {
            if (searchHistory.length > 0) {
              setShowDropdown(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Cari Barang"
          className="w-full pl-4 pr-10 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 font-inter text-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 🔹 Dropdown */}
      {showDropdown && (
        <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* 🔹 History (only show when there's no query) */}
          {!debouncedQuery.trim() && searchHistory.length > 0 && (
            <div className="border-b border-gray-200">
              <p className="px-4 py-2 text-xs text-gray-400">
                Riwayat Pencarian
              </p>
              {searchHistory.map((item, idx) => (
                <div
                  key={`history-${idx}`}
                  onClick={() => handleSearch(item)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* 🔹 Results (only show when there’s a query) */}
          {debouncedQuery.trim() &&
            (results.length > 0 ? (
              results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSearch(item.name)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                >
                  {item.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                Tidak ada produk dengan nama "{debouncedQuery}"
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
