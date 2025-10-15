import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Upload, X, FileImage } from "lucide-react";
import { submitDispute } from "../../services/userService";

const DisputeReasonOptions = [
  { value: "WRONG_ITEM", label: "Barang Salah" },
  { value: "DAMAGED_ITEM", label: "Barang Rusak" },
  { value: "MISSING_ITEM", label: "Barang Hilang" },
  { value: "LATE_DELIVERY", label: "Pengiriman Terlambat" },
  { value: "POOR_QUALITY", label: "Kualitas Buruk" },
  { value: "OTHER", label: "Lainnya" },
];

const SubmitDisputeModal = ({ order, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    orderId: order?.id || "",
    reason: "",
    description: "",
    imageUrl: [],
  });

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValidType) {
        setError("Hanya file gambar yang diperbolehkan");
        return false;
      }

      if (!isValidSize) {
        setError("Ukuran file maksimal 5MB");
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Add to selected files
    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviews = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setUploadedImages((prev) => [...prev, ...newPreviews]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeImage = (index) => {
    const imageToRemove = uploadedImages[index];

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imageToRemove.preview);

    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.reason) {
      setError("Pilih alasan dispute");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Deskripsi dispute harus diisi");
      return false;
    }

    if (formData.description.trim().length < 10) {
      setError("Deskripsi minimal 10 karakter");
      return false;
    }

    // If reason is OTHER, require at least one image
    if (formData.reason === "OTHER" && uploadedImages.length === 0) {
      setError("Untuk alasan 'Lainnya', wajib menyertakan bukti foto");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // For now, we'll use placeholder URLs since we don't have file upload endpoint
      // In real implementation, you'd upload files first and get URLs
      const imageUrls = uploadedImages.map(
        (_, index) => `placeholder-image-${Date.now()}-${index}.jpg`
      );

      const disputeData = {
        orderId: formData.orderId,
        reason: formData.reason,
        description: formData.description.trim(),
        imageUrl: imageUrls,
      };

      const response = await submitDispute(disputeData);

      setSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        resetForm();
      }, 2000);
    } catch (err) {
      console.error("Error submitting dispute:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Gagal mengirim dispute. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: order?.id || "",
      reason: "",
      description: "",
      imageUrl: [],
    });
    setSelectedFiles([]);
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setError(null);
    setSuccess(false);
  };

  const handleOpenChange = (open) => {
    if (!open && !isSubmitting) {
      resetForm();
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Submit Dispute
            </div>
            <div className="text-sm font-normal text-gray-500">
              Order #{order?.id?.slice(0, 8)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dispute Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Dispute *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => handleInputChange("reason", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih alasan dispute" />
              </SelectTrigger>
              <SelectContent>
                {DisputeReasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Dispute *</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan masalah yang terjadi dengan detail..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Minimal 10 karakter ({formData.description.length}/10)
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Bukti Foto (Opsional)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="imageUpload"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="imageUpload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload
                  className={`h-8 w-8 ${
                    isDragOver ? "text-blue-500" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isDragOver ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  {isDragOver
                    ? "Lepaskan file di sini"
                    : "Klik untuk upload foto atau drag & drop"}
                </span>
                <span className="text-xs text-gray-500">
                  Maksimal 5MB per file, format JPG/PNG
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {formData.reason === "OTHER" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Untuk alasan "Lainnya", bukti foto wajib disertakan.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Dispute berhasil dikirim! Tim kami akan segera memproses keluhan
                Anda.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Dispute"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitDisputeModal;
