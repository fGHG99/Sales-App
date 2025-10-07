// src/components/cart/sections/StoreSection.js
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StoreIcon, Clock, MapPin, Loader2 } from "lucide-react";
import api from "../../../utils/api";

export default function StoreSection({
  deliveryOption,
  selectedAddress,
  selectedStore,
  setSelectedStore,
}) {
  const [nearestStore, setNearestStore] = useState(null);
  const [isLoadingStore, setIsLoadingStore] = useState(false);

  // Fetch nearest store when delivery option changes to courier or when address changes
  useEffect(() => {
    console.log("🔍 StoreSection useEffect triggered:", {
      deliveryType: deliveryOption.type,
      selectedAddress,
      hasAddress: !!selectedAddress,
    });

    if (deliveryOption.type === "courier" && selectedAddress) {
      console.log("✅ Conditions met, fetching nearest store...");
      fetchNearestStore();
    } else {
      console.log("⏸️ Skipping fetch:", {
        isCourier: deliveryOption.type === "courier",
        hasAddress: !!selectedAddress,
      });
    }
  }, [deliveryOption.type, selectedAddress]);

  // Fetch pickup time slots when store is selected
  useEffect(() => {
    if (nearestStore?.id) {
      setSelectedStore?.(nearestStore);
    }
  }, [nearestStore?.id]);

  const fetchNearestStore = async () => {
    try {
      setIsLoadingStore(true);
      console.log("🏪 Fetching nearest store for address:", selectedAddress);
      console.log("📍 Request payload:", {
        addressId: selectedAddress,
        limit: 1,
      });

      const response = await api.get("/store/nearest", {
        params: {
          addressId: selectedAddress,
          limit: 1,
        },
      });

      console.log("✅ Nearest store response:", response.data);
      console.log("📦 Stores array:", response.data.stores);

      if (response.data.stores && response.data.stores.length > 0) {
        const store = response.data.stores[0];
        console.log("🏪 Setting nearest store:", store);
        setNearestStore(store);
      } else {
        setNearestStore(null);
        console.warn("⚠️ No stores found near the selected address");
      }
    } catch (error) {
      console.error("❌ Failed to fetch nearest store:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setNearestStore(null);
    } finally {
      setIsLoadingStore(false);
    }
  };

  const formatStoreAddress = (address) => {
    if (!address) return "";
    const parts = [
      address.fullAddress,
      address.city,
      address.province,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);

    // Format to Indonesian timezone (Asia/Jakarta - WIB UTC+7)
    return date.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
    });
  };

  const isStoreOpen = (openHour, closeHour) => {
    if (!openHour || !closeHour) return false;

    // Get current time in Indonesian timezone (WIB - UTC+7)
    const now = new Date();
    const indonesianTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const currentHours = indonesianTime.getHours();
    const currentMinutes = indonesianTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    // Get store opening time in Indonesian timezone
    const openDate = new Date(openHour);
    const openIndonesian = new Date(
      openDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const openHours = openIndonesian.getHours();
    const openMinutes = openIndonesian.getMinutes();
    const openTimeInMinutes = openHours * 60 + openMinutes;

    // Get store closing time in Indonesian timezone
    const closeDate = new Date(closeHour);
    const closeIndonesian = new Date(
      closeDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
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

  // Don't show if delivery option is not courier
  if (deliveryOption.type !== "courier") {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            <StoreIcon className="w-4 h-4" />
          </div>
          Fulfillment Store
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store Information */}
        {!selectedAddress ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <StoreIcon className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm font-medium text-yellow-900">
              Please select a delivery address first
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              We'll find the nearest store to your selected address
            </p>
          </div>
        ) : isLoadingStore ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Finding nearest store...
            </span>
          </div>
        ) : nearestStore ? (
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <StoreIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-card-foreground">
                {nearestStore.name}
              </p>
              <div className="flex items-start gap-1 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {formatStoreAddress(nearestStore.address)}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span
                    className={
                      isStoreOpen(nearestStore.openHour, nearestStore.closeHour)
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {isStoreOpen(nearestStore.openHour, nearestStore.closeHour)
                      ? "Open"
                      : "Closed"}
                  </span>
                  <span className="text-muted-foreground">
                    • {formatTime(nearestStore.openHour)} -{" "}
                    {formatTime(nearestStore.closeHour)}
                  </span>
                </span>
                <span className="text-primary font-medium">
                  {nearestStore.distanceDisplay} away
                </span>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Nearest Store • Auto-selected
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center">
            <StoreIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No stores available near your location
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please select a different delivery address
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
