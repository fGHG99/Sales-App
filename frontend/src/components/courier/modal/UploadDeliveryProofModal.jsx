import React, { useState, useRef } from "react";
import { X, Camera, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";

/**
 * Modal for uploading delivery proof with camera or file upload support
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to close the modal
 * @param {string} orderId - Order ID for delivery proof upload
 * @param {function} onUploadSuccess - Callback when upload succeeds
 */
const UploadDeliveryProofModal = ({
  isOpen,
  onClose,
  orderId,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState(null); // 'camera' or 'file'
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Detect if device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Reset modal state
  const resetModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadMethod(null);
    setIsUploading(false);
    setIsDragging(false);
  };

  // Handle modal close
  const handleClose = () => {
    if (!isUploading) {
      resetModal();
      onClose();
    }
  };

  // Handle file selection from device
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  // Process selected file
  const processFile = (file) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload button click
  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);

    try {
      // Call the upload success callback with the file
      await onUploadSuccess(orderId, selectedFile);

      // Reset modal state first
      setIsUploading(false);
      resetModal();

      // Close modal with proper cleanup
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err) {
      console.error("Error uploading delivery proof:", err);
      // Error handling is done in the parent component
      setIsUploading(false);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadMethod(null);

    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Drag and Drop handlers (Desktop only)
  const handleDragOver = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Upload Delivery Proof
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preview or Upload Options */}
          {previewUrl ? (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={previewUrl}
                  alt="Delivery proof preview"
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                />
                {!isUploading && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Info */}
              <div className="text-sm text-gray-600">
                <p>
                  <strong>File:</strong> {selectedFile?.name}
                </p>
                <p>
                  <strong>Size:</strong>{" "}
                  {(selectedFile?.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drag & Drop Zone (Desktop) or Upload Instructions (Mobile) */}
              <div
                className={`text-center text-sm rounded-lg transition-all ${
                  !isMobile && isDragging
                    ? "border-2 border-blue-500 bg-blue-100 p-8"
                    : !isMobile
                    ? "border-2 border-dashed border-gray-300 bg-blue-50 p-6 hover:border-blue-400 hover:bg-blue-100 cursor-pointer"
                    : "bg-blue-50 p-3"
                }`}
                onDragOver={!isMobile ? handleDragOver : undefined}
                onDragEnter={!isMobile ? handleDragEnter : undefined}
                onDragLeave={!isMobile ? handleDragLeave : undefined}
                onDrop={!isMobile ? handleDrop : undefined}
                onClick={
                  !isMobile ? () => fileInputRef.current?.click() : undefined
                }
              >
                <ImageIcon
                  className={`mx-auto mb-2 ${
                    !isMobile && isDragging
                      ? "w-12 h-12 text-blue-600 animate-bounce"
                      : !isMobile
                      ? "w-10 h-10 text-blue-600"
                      : "w-8 h-8 text-blue-600"
                  }`}
                />
                {!isMobile && isDragging ? (
                  <p className="text-blue-700 font-semibold">
                    Drop image here to upload
                  </p>
                ) : !isMobile ? (
                  <div className="text-gray-600">
                    <p className="font-medium mb-1">
                      Drag & drop image here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports: JPG, PNG, JPEG (Max 5MB)
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Take a photo or upload an image as proof of delivery
                  </p>
                )}
              </div>

              {/* Camera Input (Mobile-friendly) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Camera Button */}
                <Button
                  onClick={() => {
                    setUploadMethod("camera");
                    cameraInputRef.current?.click();
                  }}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-auto py-4"
                >
                  <Camera className="w-5 h-5" />
                  <span>Take Photo</span>
                </Button>

                {/* File Upload Button */}
                <Button
                  onClick={() => {
                    setUploadMethod("file");
                    fileInputRef.current?.click();
                  }}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-auto py-4"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Proof
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadDeliveryProofModal;
