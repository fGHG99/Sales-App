import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Truck, MapPin, Clock, Navigation, Store } from "lucide-react";

export default function DeliveryOptionsModal({
  open,
  onOpenChange,
  onDeliverySelect,
  nearbyStores = [],
  isLoadingStores = false,
  onFetchStores,
  currentDeliveryFee = 0,
  isLoadingDeliveryFee = false,
  currentTime = null,
  currentHour = null,
}) {
  const [selectedOption, setSelectedOption] = useState("courier");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showMap, setShowMap] = useState(null);

  useEffect(() => {
    // Reset selections when modal closes
    if (!open) {
      setSelectedStore("");
      setSelectedTime("");
    }
  }, [open]);

  // Fetch stores when user selects pickup option
  useEffect(() => {
    if (
      open &&
      selectedOption === "pickup" &&
      nearbyStores.length === 0 &&
      !isLoadingStores &&
      onFetchStores
    ) {
      console.log("📦 Fetching stores for pickup option...");
      onFetchStores();
    }
  }, [
    open,
    selectedOption,
    nearbyStores.length,
    isLoadingStores,
    onFetchStores,
  ]);

  // Helper function to convert UTC to WIB timezone
  const convertUTCToWIB = (utcTime) => {
    if (!utcTime) return new Date();

    const utcDate = new Date(utcTime);
    // Add 7 hours for WIB timezone
    const wibDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
    return wibDate;
  };

  // Helper function to parse store hours (flexible format support)
  const parseStoreHours = (openHour, closeHour) => {
    try {
      let openH, closeH;

      // Check if format is ISO datetime (e.g., "2025-10-14T19:00:00.000Z")
      if (openHour.includes("T") && openHour.includes("Z")) {
        // Format: "2025-10-14T19:00:00.000Z" - Parse as Date and extract hour
        const openDate = new Date(openHour);
        const closeDate = new Date(closeHour);

        // Convert to WIB timezone
        const openWIB = new Date(openDate.getTime() + 7 * 60 * 60 * 1000);
        const closeWIB = new Date(closeDate.getTime() + 7 * 60 * 60 * 1000);

        openH = openWIB.getHours();
        closeH = closeWIB.getHours();

        console.log("🕐 Parsed ISO datetime:", {
          originalOpen: openHour,
          originalClose: closeHour,
          openWIB: openWIB.toLocaleString("id-ID"),
          closeWIB: closeWIB.toLocaleString("id-ID"),
          parsedHours: { openH, closeH },
        });
      }
      // Check if format is "16:00 - 04:00" (already formatted)
      else if (openHour.includes(":") && !openHour.includes(" ")) {
        // Format: "16:00"
        openH = parseInt(openHour.split(":")[0]);
        closeH = parseInt(closeHour.split(":")[0]);
      } else if (openHour.includes(" ")) {
        // Format: "2025-10-07 09:00:00"
        const openTime = openHour.split(" ")[1];
        const closeTime = closeHour.split(" ")[1];
        openH = parseInt(openTime.split(":")[0]);
        closeH = parseInt(closeTime.split(":")[0]);
      } else {
        console.warn("⚠️ Unknown time format:", { openHour, closeHour });
        return { openH: 0, closeH: 24 };
      }

      return { openH, closeH };
    } catch (error) {
      console.error("❌ Error parsing store hours:", error, {
        openHour,
        closeHour,
      });
      return { openH: 0, closeH: 24 };
    }
  };

  // Helper function to check if current time is within store hours (handles overnight ranges)
  const isTimeInRange = (currentHour, openH, closeH) => {
    // Handle overnight ranges (e.g., 16:00-04:00)
    if (openH > closeH) {
      // Store is open overnight: currentHour >= openH OR currentHour < closeH
      return currentHour >= openH || currentHour < closeH;
    } else {
      // Normal range (e.g., 09:00-21:00): openH <= currentHour < closeH
      return currentHour >= openH && currentHour < closeH;
    }
  };

  // Helper function to format store hours for display
  const formatStoreHours = (openHour, closeHour) => {
    try {
      if (!openHour || !closeHour) return "Hours not available";

      // Check if already formatted (e.g., "16:00 - 04:00")
      if (
        openHour.includes(":") &&
        !openHour.includes(" ") &&
        !openHour.includes("T")
      ) {
        return `${openHour} - ${closeHour} WIB`;
      }

      // Parse datetime format (ISO or other formats)
      const openTime = new Date(openHour);
      const closeTime = new Date(closeHour);

      // Convert to WIB timezone
      const openWIB = new Date(openTime.getTime() + 7 * 60 * 60 * 1000);
      const closeWIB = new Date(closeTime.getTime() + 7 * 60 * 60 * 1000);

      // Format to HH:MM WIB
      const openFormatted = openWIB.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const closeFormatted = closeWIB.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return `${openFormatted} - ${closeFormatted} WIB`;
    } catch (error) {
      console.error("❌ Error formatting store hours:", error, {
        openHour,
        closeHour,
      });
      return "Hours not available";
    }
  };

  const generateTimeSlots = (openHour, closeHour) => {
    const slots = [];

    // Validate input parameters
    if (!openHour || !closeHour) {
      console.warn("⚠️ Missing openHour or closeHour:", {
        openHour,
        closeHour,
      });
      return slots;
    }

    // Parse store hours using flexible parser
    const { openH, closeH } = parseStoreHours(openHour, closeHour);

    // Get current time in WIB
    const now = currentTime ? convertUTCToWIB(currentTime) : new Date();
    const currentHourInWIB = now.getHours();
    const currentMinute = now.getMinutes();

    console.log("🕐 Current time info:", {
      currentTime: currentTime,
      currentHourInWIB: currentHourInWIB,
      currentMinute: currentMinute,
      parsedHours: { openH, closeH },
    });

    try {
      // Calculate the next available hour (1 hour from now)
      const nextAvailableHour =
        currentMinute > 0 ? currentHourInWIB + 2 : currentHourInWIB + 1;

      // Handle overnight ranges (e.g., 16:00-04:00)
      if (openH > closeH) {
        // Store is open overnight
        let startHour;

        if (currentHourInWIB >= openH) {
          // Current time is after opening hour (e.g., 18:00 after 16:00)
          startHour = Math.max(nextAvailableHour, openH);
          // Generate slots until midnight
          while (startHour < 24) {
            const timeString = `${startHour.toString().padStart(2, "0")}:00`;
            slots.push({
              value: timeString,
              display: timeString,
            });
            startHour += 1;
          }
          // Generate slots from midnight to closing hour
          startHour = 0;
          while (startHour < closeH) {
            const timeString = `${startHour.toString().padStart(2, "0")}:00`;
            slots.push({
              value: timeString,
              display: timeString,
            });
            startHour += 1;
          }
        } else if (currentHourInWIB < closeH) {
          // Current time is before closing hour (e.g., 02:00 before 04:00)
          startHour = Math.max(nextAvailableHour, 0);
          while (startHour < closeH) {
            const timeString = `${startHour.toString().padStart(2, "0")}:00`;
            slots.push({
              value: timeString,
              display: timeString,
            });
            startHour += 1;
          }
        }
      } else {
        // Normal range (e.g., 09:00-21:00)
        let startHour = Math.max(nextAvailableHour, openH);

        // Generate slots with 1-hour intervals
        while (startHour < closeH) {
          const timeString = `${startHour.toString().padStart(2, "0")}:00`;
          slots.push({
            value: timeString,
            display: timeString,
          });
          startHour += 1;
        }
      }

      console.log("⏰ Generated time slots:", slots);
    } catch (error) {
      console.error("❌ Error generating time slots:", error, {
        openHour,
        closeHour,
      });
    }

    return slots;
  };

  const handleConfirm = () => {
    if (selectedOption === "courier") {
      onDeliverySelect({
        type: "courier",
        cost: isLoadingDeliveryFee ? 0 : currentDeliveryFee,
      });
    } else if (selectedOption === "pickup" && selectedStore && selectedTime) {
      onDeliverySelect({
        type: "pickup",
        storeId: selectedStore,
        pickupTime: selectedTime,
        cost: 0,
      });
    }
    onOpenChange(false);
  };

  // Helper function to check if store is currently open
  const isStoreOpen = (store) => {
    // Get current time in WIB
    const now = currentTime ? convertUTCToWIB(currentTime) : new Date();
    const currentHourInWIB = now.getHours();

    // Validate store data
    if (!store || !store.openHour || !store.closeHour) {
      console.warn("⚠️ Missing store hours data:", store);
      return true; // Default to open if data is missing
    }

    try {
      // Parse store hours using flexible parser
      const { openH, closeH } = parseStoreHours(
        store.openHour,
        store.closeHour
      );

      // Check if current time is within store hours (handles overnight ranges)
      const isOpen = isTimeInRange(currentHourInWIB, openH, closeH);

      console.log("🏪 Store open check:", {
        currentHourInWIB,
        openH,
        closeH,
        isOpen,
        storeHours: `${store.openHour} - ${store.closeHour}`,
      });

      return isOpen;
    } catch (error) {
      console.error(
        "❌ Error parsing store hours in isStoreOpen:",
        error,
        store
      );
      return true; // Default to open if parsing fails
    }
  };

  // Helper function to check if pickup is available for selected store
  const isPickupAvailable = () => {
    if (selectedOption !== "pickup" || !selectedStore) return true;

    const store = nearbyStores.find((s) => s.id === selectedStore);
    if (!store) return true;

    const storeIsOpen = isStoreOpen(store);
    const timeSlots = generateTimeSlots(store.openHour, store.closeHour);
    const hasAvailableSlots = timeSlots.length > 0;

    return storeIsOpen && hasAvailableSlots;
  };

  const MapModal = ({ store }) => (
    <Dialog open={showMap === store.id} onOpenChange={() => setShowMap(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {store.name} Location
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 text-muted-foreground">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">{store.name}</p>
                <p className="text-sm text-muted-foreground">{store.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatStoreHours(store.openHour, store.closeHour)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="w-4 h-4" />
                <span>{store.distance} away</span>
              </div>
            </div>
          </div>

          {/* Mock map placeholder */}
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 opacity-50"></div>
            <div className="relative z-10 text-center">
              <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-foreground">{store.name}</p>
              <p className="text-sm text-muted-foreground">
                {store.distance} from your location
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Choose Delivery Option
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Option Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedOption === "courier"
                    ? "ring-2 ring-primary bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => {
                  setSelectedOption("courier");
                  setSelectedStore("");
                  setSelectedTime("");
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Truck className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-lg">Courier Delivery</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Fast delivery to your address
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      1-2 business days
                    </span>
                    <Badge variant="secondary">
                      {isLoadingDeliveryFee
                        ? "Loading..."
                        : currentDeliveryFee === 0
                        ? "Free"
                        : `Rp ${currentDeliveryFee.toLocaleString("id-ID")}`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedOption === "pickup"
                    ? "ring-2 ring-primary bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => {
                  setSelectedOption("pickup");
                  setSelectedStore("");
                  setSelectedTime("");
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 text-primary">
                      <Store className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Store Pickup</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Pick up from nearest store
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Same day available
                    </span>
                    <Badge variant="secondary">Free</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Store Selection for Pickup */}
            {selectedOption === "pickup" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Select Store & Pickup Time
                </h3>

                {isLoadingStores ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-64" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-9 w-24" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : nearbyStores.length === 0 ? (
                  <div className="p-8 text-center">
                    <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium mb-1">
                      No stores available
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unable to find stores near your location
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nearbyStores.map((store) => {
                      const isExpanded = selectedStore === store.id;
                      const storeIsOpen = isStoreOpen(store);
                      const timeSlots = generateTimeSlots(
                        store.openHour,
                        store.closeHour
                      );
                      const hasAvailableSlots = timeSlots.length > 0;

                      return (
                        <Card
                          key={store.id}
                          className={`cursor-pointer transition-all ${
                            isExpanded
                              ? "ring-2 ring-primary bg-accent"
                              : storeIsOpen && hasAvailableSlots
                              ? "hover:bg-accent/50"
                              : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={() => {
                            if (storeIsOpen && hasAvailableSlots) {
                              setSelectedStore(store.id);
                              setSelectedTime("");
                            }
                          }}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                                <div className="w-6 h-6 text-primary">
                                  <Store className="w-6 h-6" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{store.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {store.distance}
                                  </Badge>
                                  {!storeIsOpen && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Closed
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {store.address}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {formatStoreHours(
                                        store.openHour,
                                        store.closeHour
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMap(store.id);
                                }}
                              >
                                View Map
                              </Button>
                            </div>

                            {/* Time Selection shown only if expanded */}
                            {isExpanded && (
                              <div className="pt-3 border-t">
                                <h4 className="font-medium mb-2">
                                  Select Pickup Time
                                </h4>
                                {(() => {
                                  if (!hasAvailableSlots) {
                                    return (
                                      <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge
                                            variant="destructive"
                                            className="text-xs"
                                          >
                                            Closed
                                          </Badge>
                                          <span className="text-sm font-medium text-red-800">
                                            No pickup slots available today
                                          </span>
                                        </div>
                                        <p className="text-xs text-red-600">
                                          Store is closed or no time slots
                                          available after current time
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <Select
                                      value={selectedTime}
                                      onValueChange={setSelectedTime}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose pickup time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeSlots.map((slot) => (
                                          <SelectItem
                                            key={slot.value}
                                            value={slot.value}
                                          >
                                            {slot.display}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  );
                                })()}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  (selectedOption === "pickup" &&
                    (!selectedStore ||
                      !selectedTime ||
                      !isPickupAvailable())) ||
                  (selectedOption === "courier" && false)
                }
                className="flex-1"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Modals */}
      {nearbyStores.map((store) => (
        <MapModal key={store.id} store={store} />
      ))}
    </>
  );
}
