import { useState, useEffect } from "react";
import { MapPin, Plus, Check } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import AddressForm from "./AddressForm";
import MapTilerForModal from "./MapTilerForModal";
import {
  getCurrentLocation,
  performAutocompleteSearch,
} from "./AddressHandler";
import MapTilerSearch from "./MapTilerSearch";

const AddAddressModal = ({ onAddAddress, editingAddress, onClose }) => {
  const [activeTab, setActiveTab] = useState("location");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressData, setAddressData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [externalSearchResult, setExternalSearchResult] = useState(null);

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

  const handleAddressSubmit = (formData) => {
    const newAddress = {
      ...formData,
      coordinates: selectedLocation
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : null,
      fullAddress: `${formData.streetAddress}, ${formData.subDistrictName}, ${formData.districtName}, ${formData.cityName}, ${formData.provinceName} ${formData.postalCode}`,
    };
    onAddAddress(newAddress);
  };

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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddAddressModal;
