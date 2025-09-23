// src/components/cart/sections/OrderItemsSection.js
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";

export default function OrderItemsSection({
  cartItems,
  setCartItems,
  selectedItems,
  setSelectedItems,
  formatIDR,
  subtotal,
  setShowDeleteModal,
  setItemToDelete,
}) {
  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          if (item.quantity === 1 && newQuantity < 1) {
            setItemToDelete(itemId);
            setShowDeleteModal(true);
            return item;
          }
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      })
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            Order Items ({cartItems.length})
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                selectedItems.size === cartItems.length && cartItems.length > 0
              }
              onCheckedChange={toggleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All
            </label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-muted rounded-lg"
          >
            <Checkbox
              checked={selectedItems.has(item.id)}
              onCheckedChange={() => toggleItemSelection(item.id)}
            />
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-md"
            />
            <div className="flex-1">
              <h4 className="font-medium text-card-foreground">{item.name}</h4>
              <p className="text-sm text-muted-foreground">
                {formatIDR(item.price)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-medium text-card-foreground">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-right">
              <p className="font-semibold text-card-foreground">
                {formatIDR(item.price * item.quantity)}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => {
                setItemToDelete(item.id);
                setShowDeleteModal(true);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}

        <Separator className="bg-border" />

        <div className="flex justify-between items-center text-lg font-semibold">
          <span className="text-card-foreground">
            Subtotal{" "}
            {selectedItems.size > 0 && `(${selectedItems.size} items)`}
          </span>
          <span className="text-card-foreground">{formatIDR(subtotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
