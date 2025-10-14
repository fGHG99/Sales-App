import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Truck, AlertCircle } from "lucide-react";
import { searchOrders } from "../../services/adminService";

// Debounce Hook
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default function AdminSearch({ searchQuery, setSearchQuery, onSelect }) {
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(searchQuery, 400);

  // Fetch search results from API
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await searchOrders(debouncedQuery);

        if (response.success && response.data) {
          const allResults = [];

          // Add orders to results
          if (response.data.orders && response.data.orders.length > 0) {
            response.data.orders.forEach((order) => {
              allResults.push({
                id: order.id,
                type: "order",
                status: order.orderStatus,
              });
            });
          }

          // Add couriers to results
          if (response.data.couriers && response.data.couriers.length > 0) {
            response.data.couriers.forEach((courier) => {
              allResults.push({
                id: courier.id,
                type: "courier",
                name: courier.name,
              });
            });
          }

          // Add disputes to results
          if (response.data.disputes && response.data.disputes.length > 0) {
            response.data.disputes.forEach((dispute) => {
              allResults.push({
                id: dispute.id,
                type: "dispute",
                status: dispute.status,
                orderId: dispute.orderId,
              });
            });
          }

          setResults(allResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
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
      return newHistory.slice(0, 5); // keep only last 5
    });
  };

  const handleSelect = (item) => {
    setSearchQuery(item.id);
    setShowDropdown(false);
    addToHistory(item.id);

    // Navigate based on type
    if (item.type === "order") {
      navigate(`/admin/orders?search=${encodeURIComponent(item.id)}`);
    } else if (item.type === "courier") {
      navigate(`/admin/couriers?search=${encodeURIComponent(item.id)}`);
    } else if (item.type === "dispute") {
      // Navigate to disputes with the dispute ID, or to order with orderId
      navigate(`/admin/disputes?search=${encodeURIComponent(item.id)}`);
    }

    if (onSelect) onSelect(item, item.type);
  };

  const handleSearch = (query) => {
    const searchTerm = (query && query.trim()) || debouncedQuery.trim();
    if (searchTerm) {
      addToHistory(searchTerm);
      navigate(`/admin/orders?search=${encodeURIComponent(searchTerm)}`);
      setSearchQuery(searchTerm);
      setShowDropdown(false);
    }
  };

  // Get icon and badge color based on type
  const getTypeIcon = (type) => {
    switch (type) {
      case "order":
        return <Package className="w-4 h-4" />;
      case "courier":
        return <Truck className="w-4 h-4" />;
      case "dispute":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "order":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            Order
          </span>
        );
      case "courier":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
            Courier
          </span>
        );
      case "dispute":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
            Dispute
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
            Unknown
          </span>
        );
    }
  };

  const hasResults = results.length > 0;

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
            if (searchHistory.length > 0 || debouncedQuery.trim()) {
              setShowDropdown(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Search by Order ID, Courier ID, or Dispute ID..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-inter text-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Search History (only show when there's no query) */}
          {!debouncedQuery.trim() && searchHistory.length > 0 && (
            <div className="border-b border-gray-200">
              <p className="px-4 py-2 text-xs text-gray-400 font-medium">
                Recent Searches
              </p>
              {searchHistory.map((item, idx) => (
                <div
                  key={`history-${idx}`}
                  onClick={() => handleSearch(item)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 cursor-pointer flex items-center space-x-2"
                >
                  <Search className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Search Results (only show when there's a query) */}
          {debouncedQuery.trim() && (
            <>
              {/* Loading State */}
              {isLoading && (
                <div className="px-4 py-6 text-center">
                  <div className="text-sm text-gray-500">Searching...</div>
                </div>
              )}

              {/* Results */}
              {!isLoading && hasResults && (
                <div>
                  <p className="px-4 py-2 text-xs text-gray-400 font-medium">
                    Found {results.length} result{results.length > 1 ? "s" : ""}
                  </p>
                  {results.slice(0, 10).map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => handleSelect(item)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-shrink-0 text-gray-400">
                            {getTypeIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs text-gray-900 truncate">
                              {item.id}
                            </div>
                            {/* Show additional info based on type */}
                            {item.type === "order" && item.status && (
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                Status: {item.status}
                              </div>
                            )}
                            {item.type === "courier" && item.name && (
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {item.name}
                              </div>
                            )}
                            {item.type === "dispute" && item.status && (
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                Status: {item.status}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getTypeBadge(item.type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isLoading && !hasResults && (
                <div className="px-4 py-6 text-center">
                  <div className="text-sm text-gray-500">
                    No results found for "{debouncedQuery}"
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Try searching by Order ID, Courier ID, or Dispute ID
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
