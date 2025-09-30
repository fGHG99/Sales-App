import { useState, useEffect } from "react";
import useDebounce from "../../hook/useDebounce";

const MapTilerSearch = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  onSearchResultClick,
  performAutocompleteSearch,
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery) {
      performAutocompleteSearch({
        query: debouncedSearchQuery,
        setIsSearching,
        setSearchResults,
        setShowDropdown,
      });
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [debouncedSearchQuery, performAutocompleteSearch]);

  return (
    <div className="flex flex-col gap-2">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Cari tempat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSearch()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          onClick={onSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
        >
          {isSearching ? "Mencari..." : "Cari"}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && showDropdown && (
        <div className="mb-2">
          <div className="max-h-32 overflow-y-auto border rounded-md bg-white">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() =>
                  onSearchResultClick(result, setSearchQuery, setSearchResults)
                }
                className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium text-sm">
                  {result.properties.display_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapTilerSearch;
