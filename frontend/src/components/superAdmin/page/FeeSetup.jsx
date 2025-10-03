import React, { useState } from 'react';
import { DollarSign, Save, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { mockSystemConfig } from '../mock/MockData';
import ConfirmationModal from '../modal/WarningConfirmation';

const FeeSetup = () => {
  const [config, setConfig] = useState(mockSystemConfig);
  const [formData, setFormData] = useState({
    deliveryFee: config.deliveryFee,
    minimumOrder: config.minimumOrder,
    maxDeliveryDistance: config.maxDeliveryDistance
  });
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });

  const handleSave = () => {
    setConfirmationModal({
      isOpen: true,
      action: 'update_fees',
      data: formData,
      title: 'Confirm Fee Configuration Update',
      message: 'Are you sure you want to update the fee configuration? This may affect all future orders and customer pricing calculations.'
    });
  };

  const handleReset = () => {
    setFormData({
      deliveryFee: config.deliveryFee,
      minimumOrder: config.minimumOrder,
      maxDeliveryDistance: config.maxDeliveryDistance
    });
  };

  const executeConfirmedAction = () => {
    const { action, data } = confirmationModal;
    
    if (action === 'update_fees') {
      setConfig({
        ...config,
        ...data
      });
    }
    
    setConfirmationModal({ isOpen: false, action: null, data: null });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const hasChanges = () => {
    return formData.deliveryFee !== config.deliveryFee ||
           formData.minimumOrder !== config.minimumOrder ||
           formData.maxDeliveryDistance !== config.maxDeliveryDistance;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Fee Setup</h3>
        <p className="text-gray-600">Configure delivery fees and order limits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Delivery Fee</h4>
                  <p className="text-sm text-gray-600">Standard delivery charge</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(config.deliveryFee)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Minimum Order</h4>
                  <p className="text-sm text-gray-600">Minimum order value required</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(config.minimumOrder)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Max Delivery Distance</h4>
                  <p className="text-sm text-gray-600">Maximum delivery radius</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatNumber(config.maxDeliveryDistance)} km</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Fee Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deliveryFee">Delivery Fee (IDR)</Label>
              <Input
                id="deliveryFee"
                type="number"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({
                  ...formData, 
                  deliveryFee: parseInt(e.target.value) || 0
                })}
                placeholder="Enter delivery fee"
              />
              <p className="text-sm text-gray-600 mt-1">
                Current: {formatCurrency(config.deliveryFee)}
              </p>
            </div>

            <div>
              <Label htmlFor="minimumOrder">Minimum Order Amount (IDR)</Label>
              <Input
                id="minimumOrder"
                type="number"
                value={formData.minimumOrder}
                onChange={(e) => setFormData({
                  ...formData, 
                  minimumOrder: parseInt(e.target.value) || 0
                })}
                placeholder="Enter minimum order amount"
              />
              <p className="text-sm text-gray-600 mt-1">
                Current: {formatCurrency(config.minimumOrder)}
              </p>
            </div>

            <div>
              <Label htmlFor="maxDeliveryDistance">Maximum Delivery Distance (km)</Label>
              <Input
                id="maxDeliveryDistance"
                type="number"
                value={formData.maxDeliveryDistance}
                onChange={(e) => setFormData({
                  ...formData, 
                  maxDeliveryDistance: parseInt(e.target.value) || 0
                })}
                placeholder="Enter max delivery distance"
              />
              <p className="text-sm text-gray-600 mt-1">
                Current: {formatNumber(config.maxDeliveryDistance)} km
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={!hasChanges()}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!hasChanges()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Impact Simulation */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Impact Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Small Order Example</h4>
              <p className="text-sm text-gray-600 mb-2">Order Value: IDR 25,000</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(25000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(formData.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(25000 + formData.deliveryFee)}</span>
                </div>
              </div>
              {25000 < formData.minimumOrder && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Below minimum order
                </p>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Medium Order Example</h4>
              <p className="text-sm text-gray-600 mb-2">Order Value: IDR 75,000</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(75000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(formData.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(75000 + formData.deliveryFee)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Large Order Example</h4>
              <p className="text-sm text-gray-600 mb-2">Order Value: IDR 150,000</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(150000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(formData.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(150000 + formData.deliveryFee)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, action: null, data: null })}
        onConfirm={executeConfirmedAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
    </div>
  );
};

export default FeeSetup;