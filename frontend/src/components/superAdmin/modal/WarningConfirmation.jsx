import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to override this data? This may cause problems in the future.",
  countdown = 5 
}) => {
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(countdown);
      setCanConfirm(false);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanConfirm(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, countdown]);

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      onClose();
    }
  };

  const handleClose = () => {
    setTimeLeft(countdown);
    setCanConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {message}
          </p>
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 mr-2"
            >
              Cancel
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 ml-2"
            >
              {canConfirm ? 'Confirm' : `Wait ${timeLeft}s`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;