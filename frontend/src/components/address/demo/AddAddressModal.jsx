import { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import AddressForm from './AddressForm';
import MapTilerForModal from './MapTilerForModal';
import { getCurrentLocation } from './AddressHandler';

const AddAddressModal = ({ onAddAddress, editingAddress, onClose }) => {
  const [activeTab, setActiveTab] = useState('location');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressData, setAddressData] = useState(null);

  useEffect(() => {
    if (editingAddress) {
      setSelectedLocation({
        lat: editingAddress.coordinates?.lat || -6.935577536865563,
        lng: editingAddress.coordinates?.lng || 107.57828605427846,
        address: editingAddress.fullAddress
      });
      setAddressData(editingAddress);
      setActiveTab('form');
    }
  }, [editingAddress]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setActiveTab('form');
  };

  const handleCurrentLocation = () => {
    const MAPTILER_API_KEY = import.meta.env?.VITE_MAPTILER_API_KEY;
    
    getCurrentLocation({
      map: { current: null }, // We don't have a map here, but the function will handle GPS
      addMarker: () => {}, // Mock function
      reverseGeocode: async (lat, lng, apiKey) => {
        // Simple reverse geocoding fallback
        return `Lokasi GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      },
      setSelectedAddress: (address) => {
        // This will be handled by the GPS position callback
      },
      currentMarkerRef: { current: null },
      MAPTILER_API_KEY
    });

    // Override the getCurrentLocation to work without map for this modal
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mockAddress = `Lokasi GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        const location = {
          lat: latitude,
          lng: longitude,
          address: mockAddress
        };
        
        handleLocationSelect(location);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSearchLocation = () => {
    // Mock search results for demo
    const mockSearchResults = [
      {
        lat: -6.935577536865563,
        lng: 107.57828605427846,
        address: 'Jl. Gempol Sari No. 123, Bandung Kulon, Kota Bandung, Jawa Barat'
      },
      {
        lat: -6.945577536865563,
        lng: 107.58828605427846,
        address: 'Jl. Margahayu Utara No. 45, Babakan Ciparay, Kota Bandung, Jawa Barat'
      }
    ];
    
    // For demo, select first result
    handleLocationSelect(mockSearchResults[0]);
  };

  const handleAddressSubmit = (formData) => {
    const newAddress = {
      ...formData,
      coordinates: selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null,
      fullAddress: `${formData.streetAddress}, ${formData.subDistrictName}, ${formData.districtName}, ${formData.cityName}, ${formData.provinceName} ${formData.postalCode}`
    };
    
    onAddAddress(newAddress);
  };

  return (
    <div className="w-full max-w-4xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="location" disabled={editingAddress}>
            <MapPin className="h-4 w-4 mr-2" />
            Pilih Lokasi
          </TabsTrigger>
          <TabsTrigger value="form">
            <Plus className="h-4 w-4 mr-2" />
            Isi Detail Alamat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="location" className="space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pilih Lokasi Alamat</h3>
            <p className="text-gray-600">Tentukan lokasi alamat Anda dengan salah satu cara di bawah</p>
          </div>

          {/* Location Selection Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6" onClick={handleCurrentLocation}>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Navigation className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Lokasi Saat Ini</h4>
                  <p className="text-sm text-gray-600">Gunakan GPS untuk mendeteksi lokasi Anda sekarang</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6" onClick={handleSearchLocation}>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Search className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Cari Lokasi</h4>
                  <p className="text-sm text-gray-600">Cari alamat atau tempat yang Anda inginkan</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map - Now using actual MapTiler component */}
          <MapTilerForModal onLocationSelect={handleLocationSelect} />

          {/* Selected Location Display */}
          {selectedLocation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Lokasi Terpilih</h4>
                    <p className="text-blue-700 text-sm mb-2">{selectedLocation.address}</p>
                    <div className="flex gap-4 text-xs text-blue-600">
                      <span>Lat: {selectedLocation.lat.toFixed(6)}</span>
                      <span>Lng: {selectedLocation.lng.toFixed(6)}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setActiveTab('form')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Lanjutkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Detail Alamat</h3>
            <p className="text-gray-600">Lengkapi informasi alamat pengiriman Anda</p>
          </div>

          {selectedLocation && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Lokasi: {selectedLocation.address}</span>
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