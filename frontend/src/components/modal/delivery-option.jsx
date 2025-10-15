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

  const generateTimeSlots = (openHour, closeHour) => {
    const slots = [];

    // Parse the time strings (format: "HH:MM")
    const [openH, openM] = openHour.split(":").map(Number);
    const [closeH, closeM] = closeHour.split(":").map(Number);

    // Start from opening hour
    let currentHour = openH;

    // Generate slots with 1-hour intervals
    while (currentHour < closeH) {
      const timeString = `${currentHour.toString().padStart(2, "0")}:00`;
      const displayTime = `${currentHour.toString().padStart(2, "0")}:00`;

      slots.push({
        value: timeString,
        display: displayTime,
      });

      currentHour += 1; // 1-hour interval
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
                <span>
                  {store.openHour} - {store.closeHour}
                </span>
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
                      return (
                        <Card
                          key={store.id}
                          className={`cursor-pointer transition-all ${
                            isExpanded
                              ? "ring-2 ring-primary bg-accent"
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => {
                            setSelectedStore(store.id);
                            setSelectedTime("");
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
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {store.address}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {store.openHour} - {store.closeHour}
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
                                <Select
                                  value={selectedTime}
                                  onValueChange={setSelectedTime}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose pickup time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {generateTimeSlots(
                                      store.openHour,
                                      store.closeHour
                                    ).map((slot) => (
                                      <SelectItem
                                        key={slot.value}
                                        value={slot.value}
                                      >
                                        {slot.display}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                    (!selectedStore || !selectedTime)) ||
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
