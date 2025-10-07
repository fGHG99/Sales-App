// src/components/cart/sections/DeliverySection.jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck, Settings } from "lucide-react";

export default function DeliverySection({
  deliveryOption,
  setDeliveryModalOpen,
  formatIDR,
  mockStores,
}) {
  const getDeliveryDisplayText = () => {
    if (deliveryOption.type === "courier") {
      return "Fast Courier Delivery (1-2 business days)";
    } else {
      const selectedStore = mockStores.find(
        (s) => s.id === deliveryOption.storeId
      );
      const timeDisplay = deliveryOption.pickupTime
        ? ` at ${deliveryOption.pickupTime}`
        : "";
      return `Store Pickup${
        selectedStore ? ` from ${selectedStore.name}` : ""
      }${timeDisplay}`;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            <Truck className="w-4 h-4" />
          </div>
          Delivery Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="p-4 rounded-lg border border-border hover:border-primary cursor-pointer transition-all bg-accent/50 hover:bg-accent"
          onClick={() => setDeliveryModalOpen(true)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-card-foreground mb-1 truncate">
                {getDeliveryDisplayText()}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {deliveryOption.cost === 0
                  ? "Free"
                  : formatIDR(deliveryOption.cost)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
