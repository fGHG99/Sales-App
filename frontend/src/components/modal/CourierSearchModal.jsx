import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Truck,
  MapPin,
  Clock,
} from "lucide-react";

const CourierSearchModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  postalCode,
  city,
  province,
  checkoutData, // Add checkoutData prop to trigger actual API call
}) => {
  const navigate = useNavigate();
  const [searchStatus, setSearchStatus] = useState("searching"); // searching, found, error
  const [courierData, setCourierData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isOpen && checkoutData) {
      setSearchStatus("searching");
      setCourierData(null);
      setErrorMessage("");
      setElapsedTime(0);

      // Start timer for elapsed time display
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Make actual API call to checkout endpoint
      const processCheckout = async () => {
        try {
          console.log("🚚 Starting courier search for checkout:", checkoutData);

          // Import api here to avoid circular dependency
          const { default: api } = await import("../../utils/api");

          // Call the actual checkout API
          const response = await api.post("/order/checkout", checkoutData);

          console.log("✅ Checkout with courier successful:", response.data);

          // Extract courier data from response
          if (response.data.order?.courier) {
            const courier = response.data.order.courier;
            setCourierData({
              name: courier.name,
              phone: courier.phone,
              vehicleType: "Motor", // Default since not provided in response
              estimatedArrival: "15-20 menit", // Default estimate
            });
            setSearchStatus("found");
          } else {
            // No courier in response (shouldn't happen with new API)
            setSearchStatus("found");
            setCourierData({
              name: "Kurir Ditugaskan",
              phone: "Hubungi Admin",
              vehicleType: "Motor",
              estimatedArrival: "15-20 menit",
            });
          }

          clearInterval(interval);
        } catch (error) {
          console.error("❌ Courier search failed:", error);
          clearInterval(interval);

          // Handle different error types
          if (
            error.response?.status === 503 &&
            error.response?.data?.error === "NO_COURIER_AVAILABLE"
          ) {
            setErrorMessage(
              error.response.data.message ||
                "Tidak ada kurir yang tersedia untuk area pengiriman ini."
            );
            setSearchStatus("error");
          } else if (
            error.response?.status === 400 &&
            error.response?.data?.error === "MISSING_POSTAL_CODE"
          ) {
            setErrorMessage(
              "Alamat pengiriman harus memiliki kode pos untuk penugasan kurir."
            );
            setSearchStatus("error");
          } else {
            setErrorMessage(
              error.response?.data?.message ||
                "Gagal mencari kurir. Silakan coba lagi."
            );
            setSearchStatus("error");
          }
        }
      };

      // Start the checkout process
      processCheckout();

      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen, checkoutData]);

  const handleClose = () => {
    if (searchStatus === "found") {
      onSuccess(courierData);
    } else if (searchStatus === "error") {
      onError({ message: errorMessage });
    }
    onClose();
    navigate("/user/orders");
  };

  const handleRetry = () => {
    setSearchStatus("searching");
    setCourierData(null);
    setErrorMessage("");
    setElapsedTime(0);

    // Retry the checkout process
    if (checkoutData) {
      const processCheckout = async () => {
        try {
          const { default: api } = await import("../../utils/api");
          const response = await api.post("/order/checkout", checkoutData);

          if (response.data.order?.courier) {
            const courier = response.data.order.courier;
            setCourierData({
              name: courier.name,
              phone: courier.phone,
              vehicleType: "Motor",
              estimatedArrival: "15-20 menit",
            });
            setSearchStatus("found");
          }
        } catch (error) {
          console.error("❌ Retry failed:", error);
          if (error.response?.status === 503) {
            setErrorMessage(
              error.response.data.message ||
                "Tidak ada kurir yang tersedia untuk area pengiriman ini."
            );
          } else {
            setErrorMessage(
              error.response?.data?.message ||
                "Gagal mencari kurir. Silakan coba lagi."
            );
          }
          setSearchStatus("error");
        }
      };

      processCheckout();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Mencari Kurir
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                {city && province
                  ? `${city}, ${province}`
                  : `Kode Pos: ${postalCode}`}
              </span>
            </div>
          </div>

          {/* Search Status */}
          {searchStatus === "searching" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mencari kurir terdekat...
                </h3>
                <p className="text-sm text-gray-600">
                  Mohon tunggu sebentar, kami sedang mencari kurir yang tersedia
                  di area Anda.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Waktu pencarian: {formatTime(elapsedTime)}</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Tips:</strong> Jika tidak ada kurir tersedia, Anda
                  dapat memilih metode "Pickup to Store" sebagai alternatif.
                </p>
              </div>
            </div>
          )}

          {searchStatus === "found" && courierData && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-900">
                  Kurir ditemukan!
                </h3>
                <p className="text-sm text-gray-600">
                  Kurir telah ditugaskan untuk mengantarkan pesanan Anda.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Nama Kurir:
                    </span>
                    <span className="text-sm text-gray-900">
                      {courierData.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      No. Telepon:
                    </span>
                    <span className="text-sm text-gray-900">
                      {courierData.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Kendaraan:
                    </span>
                    <span className="text-sm text-gray-900">
                      {courierData.vehicleType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {searchStatus === "error" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-900">
                  Tidak ada kurir tersedia
                </h3>
                <p className="text-sm text-gray-600">
                  {errorMessage ||
                    "Maaf, tidak ada kurir yang tersedia di area pengiriman Anda saat ini."}
                </p>
              </div>

              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Saran:</strong> Silakan coba lagi nanti atau gunakan
                  metode "Pickup to Store" sebagai alternatif.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {searchStatus === "searching" && (
              <Button variant="outline" onClick={onClose} disabled>
                Menunggu...
              </Button>
            )}

            {searchStatus === "found" && (
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700"
              >
                Lanjutkan
              </Button>
            )}

            {searchStatus === "error" && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Tutup
                </Button>
                <Button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Coba Lagi
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourierSearchModal;
