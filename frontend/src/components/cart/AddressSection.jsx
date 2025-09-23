// src/components/cart/sections/AddressSection.js
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function AddressSection({
  deliveryAddresses,
  selectedAddress,
  setSelectedAddress,
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          Delivery Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedAddress} onValueChange={setSelectedAddress}>
          <SelectTrigger className="w-full bg-input border-border text-card-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {deliveryAddresses.map((address) => (
              <SelectItem
                key={address.id}
                value={address.id}
                className="text-popover-foreground"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <div>
                    <p className="font-medium">{address.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.address}
                    </p>
                  </div>
                  {address.isDefault && (
                    <Badge variant="secondary" className="ml-2">
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
