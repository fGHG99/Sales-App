import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Alert, AlertDescription } from "../../ui/alert";
import {
  getCurrentDeliveryFee,
  updateDeliveryFee,
  getDeliveryFeeHistory,
  formatDeliveryFee,
  parseDeliveryFeeInput,
  validateDeliveryFeeInput,
} from "../../../services/deliveryFeeService";
import ConfirmationModal from "../modal/WarningConfirmation";

const FeeSetup = () => {
  // API state management
  const [currentFee, setCurrentFee] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [inputLengthError, setInputLengthError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    deliveryFee: "",
    description: "",
  });

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    action: null,
    data: null,
  });

  // Fetch current delivery fee on component mount
  useEffect(() => {
    fetchCurrentFee();
    fetchFeeHistory();
  }, []);

  // Fetch current delivery fee from API
  const fetchCurrentFee = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getCurrentDeliveryFee();

      if (response.success && response.data) {
        setCurrentFee(response.data);
        // Initialize form with current fee
        setFormData({
          deliveryFee: response.data.feeAmount
            ? response.data.feeAmount.toLocaleString("id-ID")
            : "",
          description: response.data.description || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch current delivery fee:", err);
      setError("Failed to load current delivery fee");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch delivery fee history
  const fetchFeeHistory = async () => {
    try {
      const response = await getDeliveryFeeHistory();
      if (response.success && response.data) {
        setFeeHistory(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch delivery fee history:", err);
    }
  };

  const handleSave = () => {
    // Check for input length error first
    if (inputLengthError) {
      setError("Silakan perbaiki input yang tidak valid");
      return;
    }

    // Validate form data
    const validation = validateDeliveryFeeInput(formData.deliveryFee);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setConfirmationModal({
      isOpen: true,
      action: "update_fees",
      data: formData,
      title: "Confirm Delivery Fee Update",
      message: `Are you sure you want to update the delivery fee to ${formatDeliveryFee(
        validation.amount
      )}? This will affect all future orders.`,
    });
  };

  const handleReset = () => {
    if (currentFee) {
      setFormData({
        deliveryFee: currentFee.feeAmount
          ? currentFee.feeAmount.toLocaleString("id-ID")
          : "",
        description: currentFee.description || "",
      });
    }
    setError(null);
    setSuccess(null);
    setInputLengthError(null);
  };

  const executeConfirmedAction = async () => {
    const { action, data } = confirmationModal;

    if (action === "update_fees") {
      try {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        const validation = validateDeliveryFeeInput(data.deliveryFee);
        if (!validation.isValid) {
          setError(validation.error);
          return;
        }

        const updateData = {
          feeAmount: validation.amount,
          description:
            data.description ||
            `Delivery fee updated to ${formatDeliveryFee(validation.amount)}`,
        };

        const response = await updateDeliveryFee(updateData);

        if (response.success) {
          setSuccess("Delivery fee updated successfully!");
          // Refresh data
          await fetchCurrentFee();
          await fetchFeeHistory();
        } else {
          setError("Failed to update delivery fee");
        }
      } catch (err) {
        console.error("Failed to update delivery fee:", err);
        setError(err.response?.data?.error || "Failed to update delivery fee");
      } finally {
        setIsSaving(false);
      }
    }

    setConfirmationModal({ isOpen: false, action: null, data: null });
  };

  const formatCurrency = (amount) => {
    return formatDeliveryFee(amount);
  };

  const handleDeliveryFeeChange = (e) => {
    const inputValue = e.target.value;

    // Clear previous errors
    setInputLengthError(null);
    setError(null);

    // Check input length (max 9 characters)
    if (inputValue.length > 9) {
      setInputLengthError("Masukkan data yang valid (maksimal 9 karakter)");
      return;
    }

    const numericValue = parseDeliveryFeeInput(inputValue);
    const formattedValue = numericValue.toLocaleString("id-ID");

    setFormData({
      ...formData,
      deliveryFee: formattedValue,
    });
  };

  const handleDescriptionChange = (e) => {
    setFormData({
      ...formData,
      description: e.target.value,
    });
  };

  const hasChanges = () => {
    if (!currentFee) return false;

    // Don't allow changes if there's an input length error
    if (inputLengthError) return false;

    const currentAmount = currentFee.feeAmount || 0;
    const formAmount = parseDeliveryFeeInput(formData.deliveryFee);
    const currentDesc = currentFee.description || "";

    return formAmount !== currentAmount || formData.description !== currentDesc;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Delivery Fee Management</h3>
        <p className="text-gray-600">Configure global delivery fee settings</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading delivery fee settings...</span>
        </div>
      )}

      {!isLoading && (
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
                    <p className="text-sm text-gray-600">
                      Global delivery charge
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {currentFee
                        ? formatCurrency(currentFee.feeAmount)
                        : "Rp 0"}
                    </p>
                    {currentFee?.lastUpdated && (
                      <p className="text-xs text-gray-500">
                        Updated:{" "}
                        {new Date(currentFee.lastUpdated).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {currentFee?.description && (
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <h4 className="font-medium text-sm">Description</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentFee.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fee Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Delivery Fee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Delivery Fee (IDR)</Label>
                <Input
                  id="deliveryFee"
                  type="text"
                  value={formData.deliveryFee}
                  onChange={handleDeliveryFeeChange}
                  placeholder="Masukkan biaya pengiriman (contoh: 15.000)"
                  disabled={isSaving}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Current:{" "}
                  {currentFee ? formatCurrency(currentFee.feeAmount) : "Rp 0"}
                </p>
                {formData.deliveryFee === "" && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Biaya pengiriman tidak boleh kosong
                  </p>
                )}
                {inputLengthError && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ {inputLengthError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter description for this fee change"
                  disabled={isSaving}
                />
                <p className="text-sm text-gray-600 mt-1">
                  This will be recorded in the fee change history
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges() || isSaving}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    !hasChanges() ||
                    formData.deliveryFee === "" ||
                    isSaving ||
                    inputLengthError
                  }
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee Impact Simulation */}
      {!isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Impact Simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Small Order Example</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Order Value: IDR 25,000
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(25000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>
                      {formatDeliveryFee(
                        parseDeliveryFeeInput(formData.deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>
                      {formatDeliveryFee(
                        25000 + parseDeliveryFeeInput(formData.deliveryFee)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Medium Order Example</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Order Value: IDR 75,000
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(75000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>
                      {formatDeliveryFee(
                        parseDeliveryFeeInput(formData.deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>
                      {formatDeliveryFee(
                        75000 + parseDeliveryFeeInput(formData.deliveryFee)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Large Order Example</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Order Value: IDR 150,000
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(150000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>
                      {formatDeliveryFee(
                        parseDeliveryFeeInput(formData.deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>
                      {formatDeliveryFee(
                        150000 + parseDeliveryFeeInput(formData.deliveryFee)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal({ isOpen: false, action: null, data: null })
        }
        onConfirm={executeConfirmedAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
    </div>
  );
};

export default FeeSetup;
