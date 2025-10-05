import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { cancelReasons } from '../../../utils/mockDataCourier';
import { toast } from 'sonner';

const CancelOrderModal = ({ isOpen, onClose, order, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for canceling the order');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reasonLabel = cancelReasons.find(r => r.value === selectedReason)?.label;
      
      onConfirm(order.id, {
        reason: selectedReason,
        reasonLabel,
        notes: additionalNotes,
        timestamp: new Date().toISOString()
      });
      
      toast.success('Order canceled successfully', {
        description: `Order #${order.id} has been canceled and admin has been notified.`
      });
      
      // Reset form
      setSelectedReason('');
      setAdditionalNotes('');
      onClose();
      
    } catch (error) {
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setAdditionalNotes('');
      onClose();
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Cancel Order #{order.id}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-6 w-6 p-0"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> This action cannot be undone. The order will be canceled 
              and the customer and store will be notified immediately.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Store:</strong> {order.storeName}</p>
              <p><strong>Customer:</strong> {order.customerName}</p>
              <p><strong>Value:</strong> ${order.orderValue.toFixed(2)}</p>
              <p><strong>Distance:</strong> {order.distance}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Cancellation <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason} disabled={isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {cancelReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes <span className="text-gray-400">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional details about why you're canceling this order..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReason || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Canceling Order...
              </div>
            ) : (
              'Cancel Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelOrderModal;