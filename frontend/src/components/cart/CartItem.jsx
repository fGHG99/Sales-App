import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({ 
  item, 
  isSelected, 
  onToggleSelection, 
  onUpdateQuantity, 
  onRemove, 
  formatIDR 
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
      
      <div className="flex-1">
        <h4 className="font-medium text-card-foreground">
          {item.name}
        </h4>
        <p className="text-sm text-muted-foreground">
          {formatIDR(item.price)} each
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-transparent"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
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
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}