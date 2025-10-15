// // src/components/cart/sections/OrderSummary.js
// import { useNavigate } from "react-router-dom";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";

// export default function OrderSummary({
//   deliveryOption,
//   subtotal,
//   deliveryCost,
//   total,
//   formatIDR,
// }) {
//   const navigate = useNavigate();

//   const handleCheckout = () => {
//     const orderId = `ORD-${Date.now()}`;
//     navigate(`/order/checkout/${orderId}`);
//   };

//   return (
//     <Card className="bg-card border-border sticky top-22">
//       <CardHeader>
//         <CardTitle className="text-card-foreground">Order Summary</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="space-y-2">
//           <div className="flex justify-between text-sm">
//             <span className="text-muted-foreground">Subtotal</span>
//             <span className="text-card-foreground">{formatIDR(subtotal)}</span>
//           </div>
//           <div className="flex justify-between text-sm">
//             <span className="text-muted-foreground">Delivery</span>
//             <span className="text-card-foreground">
//               {formatIDR(deliveryCost)}
//             </span>
//           </div>
//         </div>

//         <Separator className="bg-border" />

//         <div className="flex justify-between items-center">
//           <span className="font-semibold text-card-foreground">Total</span>
//           <span className="text-lg font-bold text-card-foreground">
//             {formatIDR(total)}
//           </span>
//         </div>

//         <Button className="w-full" onClick={handleCheckout}>
//           Proceed to Checkout
//         </Button>

//         <div className="text-xs text-muted-foreground text-center">
//           By proceeding to checkout, you agree to our Terms of Service and
//           Privacy Policy
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// src/components/cart/sections/OrderSummary.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, XCircle, Loader2 } from "lucide-react";
import api from "../../../utils/api";
import CourierSearchModal from "../../modal/CourierSearchModal";

export default function OrderSummary({
  deliveryOption,
  subtotal,
  deliveryCost,
  total,
  formatIDR,
  selectedStore,
  cashAmount,
  selectedPayment,
  selectedAddress,
  selectedItems,
  cartItems,
  onCheckoutSuccess,
}) {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Courier search modal states
  const [showCourierSearchModal, setShowCourierSearchModal] = useState(false);
  const [courierSearchData, setCourierSearchData] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  // Clear errors when delivery option or payment changes
  useEffect(() => {
    setValidationErrors([]);
  }, [deliveryOption, selectedPayment]);

  const isStoreOpen = (store) => {
    if (!store || !store.openHour || !store.closeHour) return true;

    const now = new Date();
    const indonesianTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const currentHours = indonesianTime.getHours();
    const currentMinutes = indonesianTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const openDate = new Date(store.openHour);
    const closeDate = new Date(store.closeHour);

    const openIndonesian = new Date(
      openDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const closeIndonesian = new Date(
      closeDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    const openHours = openIndonesian.getHours();
    const openMinutes = openIndonesian.getMinutes();
    const openTimeInMinutes = openHours * 60 + openMinutes;

    const closeHours = closeIndonesian.getHours();
    const closeMinutes = closeIndonesian.getMinutes();
    let closeTimeInMinutes = closeHours * 60 + closeMinutes;

    // Handle case when store closes after midnight (e.g., opens at 10:00, closes at 00:10)
    // If closing time is earlier than opening time, it means it crosses midnight
    if (closeTimeInMinutes < openTimeInMinutes) {
      // If current time is after midnight (00:00 - close time), store is still open
      if (currentTimeInMinutes < openTimeInMinutes) {
        // We're in the early morning hours, check if we're before closing time
        return currentTimeInMinutes < closeTimeInMinutes;
      }
      // If current time is after opening time, store is still open (waiting for midnight)
      return currentTimeInMinutes >= openTimeInMinutes;
    }

    // Normal case: store opens and closes on the same day
    return (
      currentTimeInMinutes >= openTimeInMinutes &&
      currentTimeInMinutes < closeTimeInMinutes
    );
  };

  const handleProceedToCheckout = () => {
    // Clear previous errors
    setValidationErrors([]);
    const errors = [];

    // Validate delivery option
    if (!deliveryOption || !deliveryOption.type) {
      errors.push("Silakan pilih metode pengiriman (kurir atau pickup)");
    }

    // Validate cash payment - harus ada cashAmount
    if (!selectedPayment?.cashAmount || selectedPayment?.cashAmount <= 0) {
      errors.push("Silakan pilih jumlah uang cash yang akan dibayarkan");
    }

    // If there are errors, show them and don't proceed
    if (errors.length > 0) {
      setValidationErrors(errors);
      return; // Stop here - do not show confirmation modal
    }

    // Check if store is closed
    if (!isStoreOpen(selectedStore)) {
      setShowClosedModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);

      // Get user data untuk userId
      const userResponse = await api.get("/users/me");
      const userId = userResponse.data.user.id;

      // Get selected cart items dari cartItems
      const selectedCartItems = cartItems.filter((item) =>
        selectedItems.has(item.id)
      );

      // Map selected items ke cartItemIds
      const cartItemIds = selectedCartItems.map((item) => item.id);

      if (cartItemIds.length === 0) {
        setValidationErrors(["Tidak ada item yang dipilih untuk checkout"]);
        setShowConfirmModal(false);
        setIsProcessing(false);
        return;
      }

      // ✅ Determine pickupStoreId based on delivery type
      let pickupStoreId = null;

      if (deliveryOption.type === "pickup") {
        // For pickup, use selected store from dropdown
        pickupStoreId = deliveryOption.storeId;
      } else if (deliveryOption.type === "courier") {
        // For delivery, fetch nearest store from user's address
        try {
          const nearestStoreResponse = await api.get("/store/nearest", {
            params: {
              addressId: selectedAddress,
              limit: 1,
            },
          });

          if (
            nearestStoreResponse.data.stores &&
            nearestStoreResponse.data.stores.length > 0
          ) {
            pickupStoreId = nearestStoreResponse.data.stores[0].id;
            console.log(
              `📍 Nearest store for delivery: ${nearestStoreResponse.data.stores[0].name} (${nearestStoreResponse.data.stores[0].distance} km)`
            );
          } else {
            setValidationErrors([
              "Tidak ada toko terdekat yang tersedia untuk pengiriman",
            ]);
            setShowConfirmModal(false);
            setIsProcessing(false);
            return;
          }
        } catch (storeError) {
          console.error("❌ Failed to fetch nearest store:", storeError);
          setValidationErrors([
            "Gagal mendapatkan toko terdekat. Silakan coba lagi.",
          ]);
          setShowConfirmModal(false);
          setIsProcessing(false);
          return;
        }
      }

      // ✅ Validate pickupStoreId - required for all delivery types
      if (!pickupStoreId) {
        setValidationErrors([
          "Store tidak tersedia. Silakan pilih metode pengiriman yang lain.",
        ]);
        setShowConfirmModal(false);
        setIsProcessing(false);
        return;
      }

      // Prepare checkout data
      const preparedCheckoutData = {
        userId,
        deliveryAddressId: selectedAddress,
        cartItemIds,
        cashAmount: selectedPayment.cashAmount,
        deliveryType:
          deliveryOption.type === "courier" ? "DELIVERY" : "PICKUP_TO_STORE",
        deliveryFee: deliveryOption.cost,
        pickupStoreId, // ✅ Always included for both delivery types
      };

      // Add pickup time only for PICKUP_TO_STORE
      if (deliveryOption.type === "pickup") {
        preparedCheckoutData.pickupTime = deliveryOption.pickupTime;
      }

      console.log("📦 Sending checkout request:", preparedCheckoutData);

      // Store checkout data for courier search modal
      setCheckoutData(preparedCheckoutData);

      // If delivery type is courier, show courier search modal first
      if (deliveryOption.type === "courier") {
        // Get address data for courier search modal
        const addressResponse = await api.get(
          `/address/get-address/${selectedAddress}`
        );
        const addressData = addressResponse.data;
        console.log("📍 Address data:", addressData);

        setCourierSearchData({
          postalCode: addressData.postalCode,
          city: addressData.city,
          province: addressData.province,
        });

        // Close confirmation modal and show courier search modal
        setShowConfirmModal(false);
        setShowCourierSearchModal(true);
        setIsProcessing(false);
        return;
      }

      // For pickup orders, proceed directly with checkout
      await processCheckout(preparedCheckoutData);
    } catch (error) {
      console.error("❌ Checkout preparation failed:", error);
      setShowConfirmModal(false);
      setIsProcessing(false);

      const errorMessage =
        error.response?.data?.message || "Checkout gagal. Silakan coba lagi.";
      setValidationErrors([errorMessage]);
    }
  };

  const processCheckout = async (data) => {
    try {
      setIsProcessing(true);

      // Call checkout API
      const response = await api.post("/order/checkout", data);

      console.log("✅ Checkout successful:", response.data);

      // Close modals
      setShowConfirmModal(false);
      setShowCourierSearchModal(false);

      // Notify parent component to refresh cart
      if (onCheckoutSuccess) {
        onCheckoutSuccess();
      }

      // Dispatch event to update cart count
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      // Navigate to order success/detail page
      navigate("/user/orders");
    } catch (error) {
      console.error("❌ Checkout failed:", error);

      // Close modals
      setShowConfirmModal(false);
      setShowCourierSearchModal(false);

      // Handle different error types
      if (
        error.response?.status === 503 &&
        error.response?.data?.error === "NO_COURIER_AVAILABLE"
      ) {
        // No courier available - show specific error
        setValidationErrors([
          error.response.data.message ||
            "Tidak ada kurir yang tersedia untuk area pengiriman ini.",
        ]);
      } else if (error.response?.data?.shortage) {
        // Insufficient cash
        const shortage = error.response.data.shortage;
        setValidationErrors([
          `Uang yang dibayarkan kurang ${formatIDR(
            shortage
          )}. Total yang harus dibayar: ${formatIDR(
            error.response.data.required
          )}`,
        ]);
      } else {
        // General error
        const errorMessage =
          error.response?.data?.message || "Checkout gagal. Silakan coba lagi.";
        setValidationErrors([errorMessage]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCourierSearchSuccess = (courierData) => {
    console.log("✅ Courier found:", courierData);
    // Proceed with checkout after courier is found
    if (checkoutData) {
      processCheckout(checkoutData);
    }
  };

  const handleCourierSearchError = (error) => {
    console.error("❌ Courier search failed:", error);
    setShowCourierSearchModal(false);

    // Show error message
    const errorMessage =
      error.message ||
      "Tidak ada kurir yang tersedia untuk area pengiriman ini.";
    setValidationErrors([errorMessage]);
  };

  return (
    <Card className="bg-card border-border sticky top-22">
      <CardHeader>
        <CardTitle className="text-card-foreground">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-card-foreground">{formatIDR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-card-foreground">
              {formatIDR(deliveryCost)}
            </span>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-card-foreground">Total</span>
          <span className="text-lg font-bold text-card-foreground">
            {formatIDR(total)}
          </span>
        </div>

        <Button className="w-full" onClick={handleProceedToCheckout}>
          Proceed to Checkout
        </Button>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          By proceeding to checkout, you agree to our Terms of Service and
          Privacy Policy
        </div>
      </CardContent>

      {/* Store Closed Modal */}
      <Dialog open={showClosedModal} onOpenChange={setShowClosedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <DialogTitle>Toko Tutup</DialogTitle>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Toko sedang tutup, coba lagi lain kali
            </p>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => setShowClosedModal(false)}
            >
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Konfirmasi Pesanan
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Apakah kamu yakin untuk melakukan pesanan?
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Pembayaran:
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {formatIDR(total)}
                </p>
              </div>
              {cashAmount && (
                <>
                  <Separator className="bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Jumlah Uang Dibayar:
                    </p>
                    <p className="text-xl font-semibold text-card-foreground">
                      {formatIDR(cashAmount)}
                    </p>
                  </div>
                  {cashAmount > total && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Kembalian:
                      </p>
                      <p className="text-lg font-medium text-green-600">
                        {formatIDR(cashAmount - total)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {cashAmount
                ? `Kamu harus menyiapkan uang sebesar ${formatIDR(cashAmount)}`
                : `Kamu harus membayar sebesar ${formatIDR(total)}`}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="w-full sm:w-auto"
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              onClick={handleCheckout}
              className="w-full sm:w-auto"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Lanjutkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Courier Search Modal */}
      <CourierSearchModal
        isOpen={showCourierSearchModal}
        onClose={() => setShowCourierSearchModal(false)}
        onSuccess={handleCourierSearchSuccess}
        onError={handleCourierSearchError}
        postalCode={courierSearchData?.postalCode}
        city={courierSearchData?.city}
        province={courierSearchData?.province}
        checkoutData={checkoutData}
      />
    </Card>
  );
}
