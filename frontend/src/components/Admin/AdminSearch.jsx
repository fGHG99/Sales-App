import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { orders, couriers } from "../../utils/mockDataAdmin";

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

export default function AdminSearch({ searchQuery, setSearchQuery, onSelect }) {
  const [results, setResults] = useState({ orders: [], couriers: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebouncedThrottle(searchQuery);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ orders: [], couriers: [] });
      return;
    }

    // Search for orders by ID or customer name
    const filteredOrders = orders.filter(
      (order) =>
        order.id.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(debouncedQuery.toLowerCase())
    );

    // Search for couriers by ID or name
    const filteredCouriers = couriers.filter(
      (courier) =>
        courier.id.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        courier.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );

    setResults({ orders: filteredOrders, couriers: filteredCouriers });
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

  const handleSelect = (item, type) => {
    setSearchQuery(type === "order" ? item.id : item.id);
    setShowDropdown(false);
    addToHistory(type === "order" ? item.id : item.id);
    if (onSelect) onSelect(item, type);
  };

  const handleSearch = (query) => {
    const searchTerm = (query && query.trim()) || debouncedQuery.trim();
    if (searchTerm) {
      addToHistory(searchTerm);
      // Navigate to appropriate admin page based on search results
      const hasOrders = results.orders.length > 0;
      const hasCouriers = results.couriers.length > 0;

      if (hasOrders && !hasCouriers) {
        navigate(`/admin/orders?search=${encodeURIComponent(searchTerm)}`);
      } else if (hasCouriers && !hasOrders) {
        navigate(`/admin/couriers?search=${encodeURIComponent(searchTerm)}`);
      } else {
        // If both or neither, let the user choose or navigate to general admin dashboard
        navigate(`/admin?search=${encodeURIComponent(searchTerm)}`);
      }
      setSearchQuery(searchTerm);
      setShowDropdown(false);
    }
  };

  const hasResults = results.orders.length > 0 || results.couriers.length > 0;

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
          placeholder="Search orders or couriers by ID..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-inter text-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <button
          type="button"
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
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
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Search Results (only show when there's a query) */}
          {debouncedQuery.trim() && (
            <>
              {/* Orders Section */}
              {results.orders.length > 0 && (
                <div className="border-b border-gray-200">
                  <p className="px-4 py-2 text-xs text-gray-400 font-medium">
                    Orders ({results.orders.length})
                  </p>
                  {results.orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleSelect(order, "order")}
                      className="px-4 py-3 text-sm hover:bg-blue-50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {order.id}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Customer: {order.customerName}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "sedang dikirim"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "menunggu persiapan"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Couriers Section */}
              {results.couriers.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs text-gray-400 font-medium">
                    Couriers ({results.couriers.length})
                  </p>
                  {results.couriers.slice(0, 5).map((courier) => (
                    <div
                      key={courier.id}
                      onClick={() => handleSelect(courier, "courier")}
                      className="px-4 py-3 text-sm hover:bg-blue-50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {courier.id}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {courier.name} • ⭐ {courier.rating}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                              courier.status === "aktif"
                                ? "bg-green-100 text-green-800"
                                : courier.status === "dalam perjalanan"
                                ? "bg-blue-100 text-blue-800"
                                : courier.status === "istirahat"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {courier.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!hasResults && (
                <div className="px-4 py-6 text-center">
                  <div className="text-sm text-gray-500">
                    No orders or couriers found for "{debouncedQuery}"
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Try searching by Order ID, Courier ID, customer name, or
                    courier name
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
