import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, MapPin, Edit, Trash2, Phone, User } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import useDebounce from "../../hook/useDebounce";
import useThrottle from "../../hook/useThrottle";
import { performAutocompleteSearch } from "./AddressHandler";
import AddAddressModal from "../modal/AddAddressModal";
import api from "../../../utils/api";

const AddressSearchWithHandler = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Location search states for real-time search
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Debounced search query for filtering existing addresses
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Throttled search for location API calls
  const throttledSearchQuery = useThrottle(searchQuery, 500);

  // Refs for managing search state
  const searchTimeoutRef = useRef(null);

  // Fetch user addresses from API
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user ID from localStorage or your auth context
        const user = localStorage.getItem("user");
        const userId = user ? JSON.parse(user).id : null;

        if (!userId) {
          setError("User not logged in");
          setIsLoading(false);
          return;
        }

        const response = await api.get(`/address/user/${userId}`);
        setAddresses(response.data);
      } catch (err) {
        console.error("Error fetching addresses:", err);
        setError(err.response?.data?.error || "Failed to fetch addresses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // Filter addresses based on search query
  const filteredAddresses = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return addresses;

    const query = debouncedSearchQuery.toLowerCase();
    return addresses.filter(
      (address) =>
        address.fullAddress.toLowerCase().includes(query) ||
        address.recipientName.toLowerCase().includes(query) ||
        address.streetAddress.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, addresses]);

  // Handle real-time location search using your AddressHandler
  React.useEffect(() => {
    if (throttledSearchQuery && throttledSearchQuery.length >= 3) {
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for location search
      searchTimeoutRef.current = setTimeout(() => {
        performAutocompleteSearch({
          query: throttledSearchQuery,
          setIsSearching: setIsLocationSearching,
          setSearchResults: setLocationSearchResults,
          setShowDropdown: setShowLocationDropdown,
        });
      }, 100); // Small additional delay after throttle
    } else {
      setLocationSearchResults([]);
      setShowLocationDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [throttledSearchQuery]);

  const handleSelectAddress = (addressId) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isSelected: addr.id === addressId,
      }))
    );
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await api.delete(`/address/${addressId}`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
    } catch (err) {
      console.error("Error deleting address:", err);
      alert(err.response?.data?.error || "Failed to delete address");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleAddAddress = (newAddress) => {
    // The newAddress comes from API response in AddAddressModal
    // Just add it to the local state
    if (editingAddress) {
      // Update existing address
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === editingAddress.id ? newAddress : addr))
      );
      setEditingAddress(null);
    } else {
      // Add new address (already has ID from API response)
      setAddresses((prev) => [...prev, newAddress]);
    }
    setIsAddModalOpen(false);
  };

  const handleLocationResultClick = (result) => {
    // This could be used to add location as a quick address
    // For now, we'll just set it in search to show the functionality
    setSearchQuery(result.properties.display_name);
    setLocationSearchResults([]);
    setShowLocationDropdown(false);
  };

  const hasLocationResults =
    locationSearchResults.length > 0 && showLocationDropdown;
  const hasAddressResults = filteredAddresses.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Alamat Pengiriman</h1>
        <p className="text-gray-600">
          Kelola alamat pengiriman Anda dengan mudah
        </p>
      </div>

      {/* Search and Add Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar with Location Results */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Input
              type="text"
              placeholder="Cari alamat tersimpan atau lokasi baru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />

            {/* Location Search Results Dropdown */}
            {hasLocationResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                <div className="p-2 bg-blue-50 border-b">
                  <p className="text-xs text-blue-600 font-medium">
                    Lokasi dari pencarian:
                  </p>
                </div>
                {locationSearchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleLocationResultClick(result)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-gray-900 line-clamp-1">
                          {result.properties.display_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Klik untuk menggunakan lokasi ini
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLocationSearching && (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Mencari lokasi...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Address Button */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Alamat
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-full sm:max-w-2xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Alamat" : "Tambah Alamat Baru"}
                </DialogTitle>
              </DialogHeader>
              <AddAddressModal
                onAddAddress={handleAddAddress}
                editingAddress={editingAddress}
                onClose={() => {
                  setIsAddModalOpen(false);
                  setEditingAddress(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="text-sm text-gray-600 space-y-1">
            {hasLocationResults && (
              <p>
                Ditemukan {locationSearchResults.length} lokasi baru untuk "
                {searchQuery}"
              </p>
            )}
            {hasAddressResults ? (
              <p>
                Menampilkan {filteredAddresses.length} alamat tersimpan dari
                pencarian "{searchQuery}"
              </p>
            ) : searchQuery && !hasLocationResults ? (
              <p>
                Tidak ada alamat tersimpan yang ditemukan untuk "{searchQuery}"
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Address Cards */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : hasAddressResults ? (
          filteredAddresses.map((address) => {
            return (
              <Card
                key={address.id}
                className={`transition-all duration-200 hover:shadow-md ${
                  address.isSelected
                    ? "ring-2 ring-slate-900 border-slate-900"
                    : "border-gray-200"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {address.isSelected && (
                        <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          Alamat Terpilih
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Recipient Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {address.recipientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {address.recipientPhone}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">
                        {address.fullAddress}
                      </p>
                    </div>

                    {/* Select Button */}
                    <div className="pt-3 border-t">
                      {address.isSelected ? (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ Alamat ini akan digunakan untuk pengiriman
                        </p>
                      ) : (
                        <Button
                          onClick={() => handleSelectAddress(address.id)}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          Pilih Alamat Ini
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery
                ? "Alamat tidak ditemukan"
                : "Belum ada alamat tersimpan"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Coba ubah kata kunci pencarian atau tambah alamat baru"
                : "Tambahkan alamat pertama Anda untuk memulai"}
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Alamat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSearchWithHandler;
