// src/components/cart/sections/OrderItemsSection.js
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import api from "../../../utils/api";
import { useState } from "react";

export default function OrderItemsSection({
  cartItems,
  setCartItems,
  selectedItems,
  setSelectedItems,
  formatIDR,
  subtotal,
  setShowDeleteModal,
  setItemToDelete,
  removeSelectedItems,
}) {
  const [updatingItems, setUpdatingItems] = useState(new Set());
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

  const updateQuantity = async (itemId, newQuantity) => {
    // Check if item is already being updated
    if (updatingItems.has(itemId)) return;

    // Calculate the quantity difference
    const currentItem = cartItems.find((item) => item.id === itemId);
    if (!currentItem) return;

    const quantityDiff = newQuantity - currentItem.quantity;

    // If trying to decrease below 1, show delete modal
    if (newQuantity < 1) {
      setItemToDelete(itemId);
      setShowDeleteModal(true);
      return;
    }

    try {
      // Mark item as updating
      setUpdatingItems((prev) => new Set(prev).add(itemId));

      // Optimistically update UI
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Call API to update quantity using /cart/add
      // The API automatically handles quantity updates
      await api.post("/cart/add", {
        productId: itemId,
        quantity: quantityDiff, // Send the difference (positive to add, negative to subtract)
      });

      console.log(`✅ Updated quantity for product ${itemId}: ${newQuantity}`);

      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("❌ Failed to update quantity:", error);

      // Revert optimistic update on error
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: currentItem.quantity }
            : item
        )
      );

      alert(error.response?.data?.message || "Failed to update quantity");
    } finally {
      // Remove from updating set
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
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
          <div className="flex items-center gap-3">
            {/* Delete Selected Button */}
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={removeSelectedItems}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedItems.size})
              </Button>
            )}

            {/* Select All Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedItems.size === cartItems.length &&
                  cartItems.length > 0
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
            {/* Fixed width quantity selector */}
            <div className="w-28 flex-shrink-0">
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={updatingItems.has(item.id)}
                  className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="flex-1 text-center text-sm font-medium text-gray-800 border-x border-gray-300">
                  {updatingItems.has(item.id) ? "..." : item.quantity}
                </span>

                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={updatingItems.has(item.id)}
                  className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
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
            Subtotal {selectedItems.size > 0 && `(${selectedItems.size} items)`}
          </span>
          <span className="text-card-foreground">{formatIDR(subtotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
