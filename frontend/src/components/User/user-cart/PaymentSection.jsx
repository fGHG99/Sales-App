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
          className="p-4 rounded-lg border border-border hover:border-primary cursor-pointer transition-all bg-accent/50 hover:bg-accent"
          onClick={() => setPaymentModalOpen(true)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {selectedPayment.type === "cash" ? (
                <Banknote className="w-5 h-5 text-primary" />
              ) : (
                <CreditCard className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-card-foreground mb-1 truncate">
                {getPaymentDisplayText()}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                Click to change
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
