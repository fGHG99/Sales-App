import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  StoreIcon,
  CreditCard,
  Truck,
  Settings,
  Banknote,
} from "lucide-react";
import DeliveryOptionsModal from "./modal/delivery-option";
import { PaymentOptionsModal } from "./modal/payment-option";

export default function Cart() {
  const [deliveryOption, setDeliveryOption] = useState({
    type: "courier",
    cost: 12.99,
  });

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false); // Added payment modal state
  const [selectedPayment, setSelectedPayment] = useState({
    type: "method",
    methodId: "card-1",
  });
  const [selectedAddress, setSelectedAddress] = useState("1");

  // Mock data
  const cartItems = [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      price: 299.99,
      quantity: 1,
      image: "/wireless-headphones.png",
    },
    {
      id: "2",
      name: "Smart Fitness Watch",
      price: 199.99,
      quantity: 2,
      image: "/fitness-watch.png",
    },
    {
      id: "3",
      name: "Bluetooth Speaker",
      price: 89.99,
      quantity: 1,
      image: "/bluetooth-speaker.png",
    },
  ];

  const deliveryAddresses = [
    {
      id: "1",
      name: "Home",
      address: "123 Main Street, New York, NY 10001",
      isDefault: true,
    },
    {
      id: "2",
      name: "Office",
      address: "456 Business Ave, New York, NY 10002",
      isDefault: false,
    },
    {
      id: "3",
      name: "Parents House",
      address: "789 Family Lane, Brooklyn, NY 11201",
      isDefault: false,
    },
  ];

  const store = {
    id: "1",
    name: "TechStore Manhattan",
    address: "100 Tech Plaza, Manhattan, NY 10003",
    distance: "2.3 miles",
  };

  const paymentMethods = [
    { id: "card-1", name: "Visa ending in 4242", icon: CreditCard },
    { id: "card-2", name: "Mastercard ending in 8888", icon: CreditCard },
    { id: "paypal", name: "PayPal", icon: CreditCard },
    { id: "gopay", name: "GoPay", icon: CreditCard },
    { id: "ovo", name: "OVO", icon: CreditCard },
  ];

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryCost = deliveryOption.cost;
  const total = subtotal + deliveryCost;

  const updateQuantity = (itemId, newQuantity) => {
    console.log(`Update item ${itemId} to quantity ${newQuantity}`);
  };

  const mockStores = [
    {
      id: "1",
      name: "TechStore Manhattan",
      address: "100 Tech Plaza, Manhattan, NY 10003",
      openHour: "09:00",
      closeHour: "21:00",
      distance: "2.3 miles",
    },
  ];

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

  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentDisplayText = () => {
    if (selectedPayment.type === "cash") {
      return `Cash Payment • ${formatIDR(selectedPayment.cashAmount || 0)}`;
    } else {
      const methodNames = {
        "card-1": "Visa ending in 4242",
        "card-2": "Mastercard ending in 8888",
        paypal: "PayPal",
        gopay: "GoPay",
        ovo: "OVO",
      };
      return methodNames[selectedPayment.methodId || ""] || "Digital Payment";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">
            Review your order and complete your purchase
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Cart Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Options Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  Select your options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Delivery Options */}
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Delivery Options
                  </h3>
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
                            : `$${deliveryOption.cost.toFixed(2)}`}{" "}
                          • Click to change
                        </p>
                      </div>
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </h3>
                  <div
                    className="p-4 rounded-lg border border-border hover:border-muted-foreground cursor-pointer transition-colors bg-accent"
                    onClick={() => setPaymentModalOpen(true)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {selectedPayment.type === "cash" ? (
                            <Banknote className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                          )}
                          <p className="font-medium text-card-foreground">
                            {getPaymentDisplayText()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click to change payment method
                        </p>
                      </div>
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {deliveryOption.type === "courier" && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      2
                    </div>
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedAddress}
                    onValueChange={setSelectedAddress}
                  >
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
            )}

            {/* Store Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {deliveryOption.type === "courier" ? "3" : "2"}
                  </div>
                  Fulfillment Store
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <StoreIcon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">
                      {store.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {store.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Closest store • {store.distance} away
                    </p>
                  </div>
                  <Badge variant="outline">Auto-selected</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {deliveryOption.type === "courier" ? "4" : "3"}
                  </div>
                  Order Items ({cartItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-muted rounded-lg"
                  >
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground">
                        {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* kode ini perbaiki ya !IMPORTANT! */}
                      <span className="w-8 text-center font-medium text-card-foreground">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-card-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator className="bg-border" />

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-card-foreground">Subtotal</span>
                  <span className="text-card-foreground">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-8">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-card-foreground">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {deliveryOption.type === "courier"
                        ? "Delivery"
                        : "Pickup"}
                    </span>
                    <span className="text-card-foreground">
                      {deliveryCost === 0
                        ? "Free"
                        : `$${deliveryCost.toFixed(2)}`}
                    </span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-card-foreground">Total</span>
                    <span className="text-card-foreground">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-semibold">
                  Checkout • ${total.toFixed(2)}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  By proceeding to checkout, you agree to our Terms of Service
                  and Privacy Policy
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delivery Options Modal */}
      <DeliveryOptionsModal
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        onDeliverySelect={setDeliveryOption}
        currentSelection={deliveryOption}
      />

      {/* Payment Options Modal */}
      <PaymentOptionsModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onPaymentSelect={setSelectedPayment}
        currentSelection={selectedPayment}
        subtotal={subtotal}
      />
    </div>
  );
}
