import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({
  item,
  isSelected,
  onToggleSelection,
  onUpdateQuantity,
  onRemove,
  formatIDR,
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelection(item.id)}
      />

      <img
        src={item.image || "/placeholder.svg"}
        alt={item.name}
        className="w-20 h-20 object-cover rounded-md"
      />

      {/* Item info (name + price per unit) */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-card-foreground truncate">
          {item.name}
        </h4>
        <p className="text-sm text-muted-foreground">
          {formatIDR(item.price)} each
        </p>
      </div>

      {/* Fixed width quantity selector */}
      <div className="w-28 flex-shrink-0">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={!item.inStock}
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="flex-1 text-center text-sm font-medium text-gray-800 border-x border-gray-300">
            {item.quantity}
          </span>

          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={!item.inStock}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Total price (fixed min-width so it doesn’t push other elements) */}
      <div className="text-right min-w-[90px]">
        <p className="font-semibold text-card-foreground whitespace-nowrap">
          {formatIDR(item.price * item.quantity)}
        </p>
      </div>

      {/* Remove button */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
