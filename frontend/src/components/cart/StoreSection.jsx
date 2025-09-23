// src/components/cart/sections/StoreSection.js
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StoreIcon } from "lucide-react";

export default function StoreSection({ deliveryOption, store }) {
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
      <CardContent>
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <StoreIcon className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium text-card-foreground">{store.name}</p>
            <p className="text-sm text-muted-foreground">{store.address}</p>
            <p className="text-sm text-muted-foreground">
              Closest store • {store.distance} away
            </p>
          </div>
          <span className="border px-2 py-1 rounded text-xs">Auto-selected</span>
        </div>
      </CardContent>
    </Card>
  );
}
