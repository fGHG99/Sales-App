// src/components/cart/sections/AddressSection.js
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddAddressModal from "../../address/modal/AddAddressModal";

export default function AddressSection({
  deliveryAddresses,
  selectedAddress,
  setSelectedAddress,
  isLoadingAddresses = false,
  onAddressAdded,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const selectedAddressData = deliveryAddresses.find(
    (addr) => addr.id === selectedAddress
  );

  const handleAddAddress = (newAddress) => {
    console.log("New address added:", newAddress);
    // Call parent callback to refresh addresses
    if (onAddressAdded) {
      onAddressAdded(newAddress);
    }
    setIsAddModalOpen(false);
  };

  // Show loading state
  if (isLoadingAddresses) {
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
        <CardContent className="w-full">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              Loading addresses...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state when no addresses
  if (!deliveryAddresses || deliveryAddresses.length === 0) {
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
        <CardContent className="w-full">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              No delivery addresses found. Please add an address to continue.
            </p>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            Delivery Address
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-primary hover:text-primary/80"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <Select value={selectedAddress} onValueChange={setSelectedAddress}>
          <SelectTrigger className="w-full bg-input border border-border text-card-foreground rounded-lg h-auto min-h-[70px] flex items-center justify-between p-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-left">
                {selectedAddressData ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-card-foreground truncate">
                        {selectedAddressData.name}
                      </p>
                      {selectedAddressData.isDefault && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex-shrink-0"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedAddressData.recipientName} (
                      {selectedAddressData.recipientPhone})
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {selectedAddressData.address}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Select an address</p>
                )}
              </div>
            </div>
          </SelectTrigger>

          <SelectContent className="w-[var(--radix-select-trigger-width)] bg-popover border border-border max-h-[300px]">
            {deliveryAddresses.map((address) => (
              <SelectItem
                key={address.id}
                value={address.id}
                className="text-popover-foreground cursor-pointer"
              >
                <div className="flex items-start gap-3 py-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{address.name}</p>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {address.recipientName} ({address.recipientPhone})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.address}
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>

      {/* Add Address Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-2xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <AddAddressModal
            onAddAddress={handleAddAddress}
            onClose={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
