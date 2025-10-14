import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * UserSearchBar Component
 *
 * Reusable search bar for searching users by name
 * Supports debounced search and include deleted users option
 *
 * @param {function} onSearch - Callback function when search is triggered
 * @param {boolean} showDeletedOption - Show "Include deleted accounts" checkbox
 * @param {boolean} isLoading - Loading state for search
 */
const UserSearchBar = ({
  onSearch,
  showDeletedOption = true,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      onSearch(searchQuery.trim(), includeDeleted);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setIncludeDeleted(false);
    onSearch("", false); // Reset search
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search users by name (min 2 characters)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={searchQuery.trim().length < 2 || isLoading}
          className="px-6"
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {showDeletedOption && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-deleted"
            checked={includeDeleted}
            onCheckedChange={setIncludeDeleted}
            disabled={isLoading}
          />
          <Label
            htmlFor="include-deleted"
            className="text-sm text-gray-600 cursor-pointer"
          >
            Include deleted accounts in search results
          </Label>
        </div>
      )}

      {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
        <p className="text-sm text-amber-600">
          Please enter at least 2 characters to search
        </p>
      )}
    </div>
  );
};

export default UserSearchBar;
