import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  AlertCircle,
} from "lucide-react";

export function PaymentOptionsModal({
  open,
  onOpenChange,
  onPaymentSelect,
  currentSelection,
  subtotal,
}) {
  const [selectedOption, setSelectedOption] = useState(currentSelection.type);
  const [customCashAmount, setCustomCashAmount] = useState(
    currentSelection.cashAmount?.toString() || ""
  );
  const [selectedMethodId, setSelectedMethodId] = useState(
    currentSelection.methodId || "card-1"
  );
  const [cashError, setCashError] = useState("");

  const paymentMethods = [
    {
      id: "card-1",
      name: "Visa ending in 4242",
      type: "card",
      icon: CreditCard,
      details: "Expires 12/26",
    },
    {
      id: "card-2",
      name: "Mastercard ending in 8888",
      type: "card",
      icon: CreditCard,
      details: "Expires 08/25",
    },
    {
      id: "paypal",
      name: "PayPal",
      type: "digital",
      icon: Wallet,
      details: "user@example.com",
    },
    {
      id: "gopay",
      name: "GoPay",
      type: "digital",
      icon: Smartphone,
      details: "Connected account",
    },
    {
      id: "ovo",
      name: "OVO",
      type: "digital",
      icon: Smartphone,
      details: "Connected account",
    },
  ];

  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const suggestedCashAmounts = [
    Math.ceil(subtotal / 50000) * 50000,
    Math.ceil(subtotal / 100000) * 100000,
    Math.ceil(subtotal / 100000) * 100000 + 50000,
  ];

  const validateCashAmount = (amount) => {
    const numAmount = Number.parseFloat(amount.replace(/[^\d]/g, ""));
    if (isNaN(numAmount) || numAmount < subtotal) {
      setCashError(`Amount must be at least ${formatIDR(subtotal)}`);
      return false;
    }
    setCashError("");
    return true;
  };

  const handleCashAmountChange = (value) => {
    const cleanValue = value.replace(/[^\d]/g, "");
    setCustomCashAmount(cleanValue);

    if (cleanValue) {
      validateCashAmount(cleanValue);
    } else {
      setCashError("");
    }
  };

  const handleConfirm = () => {
    if (selectedOption === "cash") {
      const amount = Number.parseFloat(customCashAmount.replace(/[^\d]/g, ""));
      if (validateCashAmount(customCashAmount)) {
        onPaymentSelect({ type: "cash", cashAmount: amount });
        onOpenChange(false);
      }
    } else {
      onPaymentSelect({ type: "method", methodId: selectedMethodId });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Select Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cash Payment Option */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedOption === "cash"
                ? "border-primary bg-accent"
                : "border-border hover:border-muted-foreground"
            }`}
            onClick={() => setSelectedOption("cash")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Banknote className="w-6 h-6 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    Cash Payment
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pay with cash on delivery/pickup
                  </p>
                </div>
              </div>

              {selectedOption === "cash" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {suggestedCashAmounts.map((amount, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomCashAmount(amount.toString());
                          setCashError("");
                        }}
                      >
                        {formatIDR(amount)}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="cash-amount"
                      className="text-card-foreground"
                    >
                      Custom Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        id="cash-amount"
                        type="text"
                        placeholder="0"
                        value={
                          customCashAmount
                            ? Number.parseInt(customCashAmount).toLocaleString(
                                "id-ID"
                              )
                            : ""
                        }
                        onChange={(e) => handleCashAmountChange(e.target.value)}
                        className={`pl-10 bg-input border-border text-card-foreground ${
                          cashError ? "border-destructive" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {cashError && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {cashError}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Minimum required:</strong> {formatIDR(subtotal)}
                    </p>
                    {customCashAmount && !cashError && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Change:</strong>{" "}
                        {formatIDR(
                          Number.parseInt(customCashAmount) - subtotal
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Digital Payment Methods */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedOption === "method"
                ? "border-primary bg-accent"
                : "border-border hover:border-muted-foreground"
            }`}
            onClick={() => setSelectedOption("method")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    Digital Payment
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pay with card or digital wallet
                  </p>
                </div>
              </div>

              {selectedOption === "method" && (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedMethodId === method.id
                          ? "border-primary bg-background"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMethodId(method.id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <method.icon className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-card-foreground">
                            {method.name}
                          </p>
                          {method.details && (
                            <p className="text-sm text-muted-foreground">
                              {method.details}
                            </p>
                          )}
                        </div>
                        {method.type === "digital" && (
                          <Badge variant="secondary" className="text-xs">
                            Digital
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="bg-border" />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                selectedOption === "cash" && (!!cashError || !customCashAmount)
              }
            >
              Confirm Payment Method
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
