import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle, Package } from "lucide-react";
import { useSingleOrderManagement } from "../../hooks/useOrderManagement";

const CompleteOrderModal = ({ order, children, onOrderComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    completeOrderOptimistic,
    isUpdating,
    error: updateError,
    hasError,
  } = useSingleOrderManagement(order);

  const handleComplete = async () => {
    setError(null);
    setSuccess(false);

    try {
      const result = await completeOrderOptimistic();

      if (result.success) {
        setSuccess(true);

        // Callback untuk parent component
        if (onOrderComplete) {
          onOrderComplete(order.id, "COMPLETED");
        }

        // Close modal after successful completion
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Error completing order:", err);
      setError(
        err.response?.data?.message ||
          "Gagal menyelesaikan pesanan. Silakan coba lagi."
      );
    }
  };

  const handleOpenChange = (open) => {
    if (!open && !isUpdating) {
      setError(null);
      setSuccess(false);
    }
    setIsOpen(open);
  };

  // Combine local error with hook error
  const displayError = error || updateError;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Selesaikan Pesanan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  <span className="font-medium text-green-600">DELIVERED</span>
                </p>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Peringatan:</strong> Pastikan order Anda sudah benar. Anda
              tidak dapat melakukan complain setelah menyelesaikan pesanan.
            </AlertDescription>
          </Alert>

          {/* Confirmation Text */}
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              Apakah Anda yakin ingin menyelesaikan pesanan ini?
            </p>
            <p className="text-sm text-gray-500">
              Setelah diselesaikan, pesanan akan berstatus{" "}
              <strong>COMPLETED</strong> dan tidak dapat diubah lagi.
            </p>
          </div>

          {/* Error Message */}
          {displayError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Pesanan berhasil diselesaikan! Status pesanan telah diubah
                menjadi COMPLETED.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isUpdating}
              className="bg-green-500 hover:bg-green-600"
            >
              {isUpdating ? "Menyelesaikan..." : "Ya, Selesaikan Pesanan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteOrderModal;
