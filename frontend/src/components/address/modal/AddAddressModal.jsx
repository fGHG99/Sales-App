import { useState, useEffect } from "react";
import { MapPin, Plus, Check } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import AddressForm from "../pages/AddressForm";
import MapTilerForModal from "../pages/MapTilerForModal";
import {
  getCurrentLocation,
  performAutocompleteSearch,
} from "../pages/AddressHandler";
import MapTilerSearch from "../demo/MapTilerSearch";
import api from "../../../utils/api";

const AddAddressModal = ({ onAddAddress, editingAddress, onClose }) => {
  const [activeTab, setActiveTab] = useState("location");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressData, setAddressData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [externalSearchResult, setExternalSearchResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingAddress) {
      setSelectedLocation({
        lat: editingAddress.coordinates?.lat || -6.935577536865563,
        lng: editingAddress.coordinates?.lng || 107.57828605427846,
        address: editingAddress.fullAddress,
      });
      setAddressData(editingAddress);
      setActiveTab("form");
    }
  }, [editingAddress]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    // setActiveTab('form');
  };

  const handleConfirmLocation = () => {
    setActiveTab("form");
  };

  const handleSearch = () => {
    // optional trigger, MapTilerSearch sudah auto pakai debounce
  };

  const handleSearchResultClick = (
    result,
    setSearchQuery,
    setSearchResults
  ) => {
    setExternalSearchResult(result); // kirim ke MapTilerForModal
    setSearchQuery(result.properties.display_name);
    setSearchResults([]);

    // Extract coordinates and create location object
    const [lng, lat] = result.geometry.coordinates;
    const address = result.properties.display_name;

    // Update selected location (this replaces the onLocationSelect call that was in MapTilerForModal)
    handleLocationSelect({
      lat,
      lng,
      address,
    });
  };

  const handleAddressSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      // Get userId from localStorage
      const user = localStorage.getItem("user");
      const userId = user ? JSON.parse(user).id : null;

      if (!userId) {
        alert("User not logged in. Please login first.");
        return;
      }

      // Prepare data for API based on schema.prisma Address model
      const addressPayload = {
        userId: userId,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        label: formData.label,
        fullAddress: formData.fullAddress,
        subDistrict: formData.subDistrict || null,
        district: formData.district || null,
        city: formData.city || null,
        province: formData.province,
        country: "Indonesia", // Default country
        postalCode: formData.postalCode,
        latitude: formData.coordinates?.lat || selectedLocation?.lat || 0,
        longitude: formData.coordinates?.lng || selectedLocation?.lng || 0,
      };

      let response;

      if (editingAddress) {
        // Update existing address
        response = await api.put(
          `/address/addresses/${editingAddress.id}`,
          addressPayload
        );
        console.log("Address updated:", response.data);
      } else {
        // Create new address
        response = await api.post("/address/addresses", addressPayload);
        console.log("Address created:", response.data);
      }

      // Pass the created/updated address to parent component
      // The response.data.data contains the address object from the API
      const savedAddress = response.data.data || response.data;
      onAddAddress(savedAddress);

      // Close modal or reset form
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert(
        error.response?.data?.message ||
          "Failed to save address. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log("address data :", selectedLocation);

  return (
    <div className="w-full max-w-4xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* <TabsList className="grid w-full grid-cols-2">
          {/* <TabsTrigger value="location" disabled={editingAddress}>
            <MapPin className="h-4 w-4 mr-2" />
            Pilih Lokasi
          </TabsTrigger>
          <TabsTrigger value="form">
            <Plus className="h-4 w-4 mr-2" />
            Isi Detail Alamat
          </TabsTrigger> */}
        {/* </TabsList> */}

        <TabsContent value="location" className="space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pilih Lokasi Alamat
            </h3>
            <p className="text-gray-600">
              Cari lokasi atau pilih langsung di peta
            </p>
          </div>

          {/* Search Bar */}
          <MapTilerSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            onSearchResultClick={handleSearchResultClick}
            performAutocompleteSearch={performAutocompleteSearch}
          />

          {/* Map */}
          <MapTilerForModal
            onLocationSelect={handleLocationSelect}
            externalSearchResult={externalSearchResult}
          />

          {/* Selected Location Display */}
          {selectedLocation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">
                      Lokasi Terpilih
                    </h4>
                    <p className="text-blue-700 text-sm mb-2">
                      {selectedLocation.address}
                    </p>
                    <div className="flex gap-4 text-xs text-blue-600">
                      <span>Lat: {selectedLocation.lat.toFixed(6)}</span>
                      <span>Lng: {selectedLocation.lng.toFixed(6)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleConfirmLocation}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Konfirmasi Lokasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Detail Alamat
            </h3>
            <p className="text-gray-600">
              Lengkapi informasi alamat pengiriman Anda
            </p>
          </div>

          {selectedLocation && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Lokasi: {selectedLocation.address}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <AddressForm
            onSubmit={handleAddressSubmit}
            initialData={addressData}
            selectedLocation={selectedLocation}
            isSubmitting={isSubmitting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddAddressModal;
