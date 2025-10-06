import React, { useState, useMemo } from "react";
import { Search, Plus, MapPin, Edit, Trash2, Phone, User } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import useDebounce from "../../hook/useDebounce";
import useThrottle from "../../hook/useThrottle";
import { mockAddresses, addressLabels } from "../demo/data/mockDataAddress";
import AddAddressModal from "./AddAddressModal";

const AddressSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addresses, setAddresses] = useState(mockAddresses);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Debounced search query for filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Throttled search for API calls (if needed)
  const throttledSearchQuery = useThrottle(searchQuery, 500);

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

  const handleSelectAddress = (addressId) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isSelected: addr.id === addressId,
      }))
    );
  };

  const handleDeleteAddress = (addressId) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleAddAddress = (newAddress) => {
    if (editingAddress) {
      // Update existing address
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === editingAddress.id
            ? { ...newAddress, id: editingAddress.id }
            : addr
        )
      );
      setEditingAddress(null);
    } else {
      // Add new address
      const addressWithId = {
        ...newAddress,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setAddresses((prev) => [...prev, addressWithId]);
    }
    setIsAddModalOpen(false);
  };

  const getLabelInfo = (labelId) => {
    return (
      addressLabels.find((label) => label.id === labelId) || addressLabels[3]
    );
  };

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
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari alamat, nama penerima, atau alamat lengkap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Add Address Button */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Alamat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <div className="text-sm text-gray-600">
            {filteredAddresses.length > 0
              ? `Menampilkan ${filteredAddresses.length} alamat dari pencarian "${searchQuery}"`
              : `Tidak ada alamat yang ditemukan untuk "${searchQuery}"`}
          </div>
        )}
      </div>

      {/* Address Cards */}
      <div className="grid gap-4">
        {filteredAddresses.length > 0 ? (
          filteredAddresses.map((address) => {
            const labelInfo = getLabelInfo(address.label);
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
                      <Badge className={labelInfo.color}>
                        {labelInfo.name}
                      </Badge>
                      {address.isSelected && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Alamat Terpilih
                        </Badge>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSearch;
