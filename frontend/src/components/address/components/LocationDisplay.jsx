import { MapPin } from "lucide-react";
import { Button } from "../../ui/button";

/**
 * LocationDisplay Component
 *
 * Menampilkan lokasi yang dipilih dengan format seperti pada gambar
 * Memiliki tombol "Ubah" untuk mengubah lokasi
 */
const LocationDisplay = ({
  selectedLocation,
  onEditLocation,
  isEditing = false,
}) => {
  if (!selectedLocation) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Titik Lokasi
        </label>
        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-500 text-sm">Belum ada lokasi dipilih</p>
        </div>
        <p className="text-xs text-gray-500">
          Untuk mempermudah pengiriman, pastikan titik lokasi kamu sudah tepat
          ya
        </p>
      </div>
    );
  }

  // Parse address untuk menampilkan format yang lebih baik
  const parseLocationAddress = (address) => {
    if (!address) return { main: "Lokasi tidak tersedia", detail: "" };

    // Split address by comma untuk mendapatkan bagian-bagian
    const parts = address.split(",").map((part) => part.trim());

    if (parts.length >= 2) {
      return {
        main: parts[0], // Bagian utama (nama tempat)
        detail: parts.slice(1).join(", "), // Detail alamat
      };
    }

    return {
      main: address,
      detail: "",
    };
  };

  const { main, detail } = parseLocationAddress(selectedLocation.address);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Titik Lokasi *
      </label>

      <div className="p-3 border border-gray-300 rounded-lg bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1">
            <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{main}</p>
              {detail && <p className="text-gray-600 text-xs mt-1">{detail}</p>}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditLocation}
            className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs px-3 py-1 h-auto"
          >
            Ubah
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Untuk mempermudah pengiriman, pastikan titik lokasi kamu sudah tepat ya
      </p>
    </div>
  );
};

export default LocationDisplay;
