// src/components/cart/sections/DeliverySection.jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck, Settings } from "lucide-react";

export default function DeliverySection({
  deliveryOption,
  setDeliveryModalOpen,
  formatIDR,
}) {
  const getDeliveryDisplayText = () => {
    if (deliveryOption.type === "courier") {
      return "Fast Courier Delivery (1-2 business days)";
    }
    return "Store Pickup";
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            <Truck className="w-4 h-4" />
          </div>
          Select your delivery options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div
            className="p-4 rounded-lg border border-border hover:border-muted-foreground cursor-pointer transition-colors bg-accent"
            onClick={() => setDeliveryModalOpen(true)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-medium text-card-foreground">
                  {getDeliveryDisplayText()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {deliveryOption.cost === 0
                    ? "Free"
                    : `${formatIDR(deliveryOption.cost)}`}{" "}
                  • Click to change
                </p>
              </div>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
