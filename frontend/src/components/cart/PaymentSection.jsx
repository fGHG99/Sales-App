// src/components/cart/sections/PaymentSection.js
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreditCard, Settings, Banknote, DollarSign } from "lucide-react";

export default function PaymentSection({
  selectedPayment,
  setPaymentModalOpen,
  formatIDR,
}) {
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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
