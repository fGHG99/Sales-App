// src/components/cart/sections/OrderSummary.js
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function OrderSummary({
  deliveryOption,
  subtotal,
  deliveryCost,
  total,
  formatIDR,
}) {
  const navigate = useNavigate();

  const handleCheckout = () => {
    const orderId = `ORD-${Date.now()}`;
    navigate(`/order/checkout/${orderId}`);
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

        <Button className="w-full" onClick={handleCheckout}>
          Proceed to Checkout
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          By proceeding to checkout, you agree to our Terms of Service and
          Privacy Policy
        </div>
      </CardContent>
    </Card>
  );
}
