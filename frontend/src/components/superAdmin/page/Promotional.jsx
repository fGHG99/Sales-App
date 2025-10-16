import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  Save,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import ImageSlider from "@/components/ImageSlider";
import {
  getPromotionals,
  createPromotional,
  updatePromotional,
  deletePromotional,
} from "@/services/promotionalService";

const Promotional = () => {
  // State management
  const [promotionals, setPromotionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedPromotional, setSelectedPromotional] = useState(null);
  const [formData, setFormData] = useState({
    altText: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const BE_URL = import.meta.env.VITE_BE_API_URL;

  // Debug BE_URL
  useEffect(() => {
    console.log("🔍 [DEBUG] BE_URL:", BE_URL);
    console.log("🔍 [DEBUG] All env vars:", import.meta.env);
  }, []);

  // Fetch promotional data from API
  const fetchPromotionals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPromotionals();

      console.log("🔍 [DEBUG] API response:", data);

      // Handle the API response structure: { success, promotionals, count }
      if (data && data.success && Array.isArray(data.promotionals)) {
        setPromotionals(data.promotionals);
        console.log("✅ [DEBUG] Promotionals set successfully:", data.promotionals);
      } else {
        console.error("❌ [DEBUG] Invalid response structure:", data);
        setPromotionals([]);
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("❌ Error fetching promotionals:", error);
      setError(
        error.response?.data?.error || "Failed to fetch promotional images"
      );
      toast.error(
        error.response?.data?.error || "Failed to fetch promotional images"
      );
      setPromotionals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionals();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setFormData({ ...formData, image: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePromotional = async () => {
    if (!formData.image || !formData.altText.trim()) {
      toast.error("Please provide both image and alt text");
      return;
    }

    const data = new FormData();
    data.append("image", formData.image);
    data.append("altText", formData.altText.trim());

    try {
      setLoading(true);
      await createPromotional(data);
      toast.success("Promotional image created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      await fetchPromotionals();
    } catch (error) {
      console.error("❌ Error creating promotional:", error);
      toast.error(
        error.response?.data?.error || "Failed to create promotional image"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePromotional = async () => {
    if (!selectedPromotional) return;

    const data = new FormData();
    if (formData.image) {
      data.append("image", formData.image);
    }
    data.append("altText", formData.altText.trim());

    try {
      setLoading(true);
      await updatePromotional(selectedPromotional.id, data);
      toast.success("Promotional image updated successfully");
      setIsEditModalOpen(false);
      resetForm();
      await fetchPromotionals();
    } catch (error) {
      console.error("❌ Error updating promotional:", error);
      toast.error(
        error.response?.data?.error || "Failed to update promotional image"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotional = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this promotional image?")
    ) {
      try {
        setLoading(true);
        await deletePromotional(id);
        toast.success("Promotional image deleted successfully");
        await fetchPromotionals();
      } catch (error) {
        console.error("❌ Error deleting promotional:", error);
        toast.error(
          error.response?.data?.error || "Failed to delete promotional image"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditClick = (promotional) => {
    setSelectedPromotional(promotional);
    setFormData({
      altText: promotional.altText,
      image: null,
    });
    setImagePreview(null);
    setIsEditModalOpen(true);
  };

  const handlePreviewClick = (promotional) => {
    setPreviewData(promotional);
    setIsPreviewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      altText: "",
      image: null,
    });
    setImagePreview(null);
    setSelectedPromotional(null);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    resetForm();
  };

  const handlePreviewModalClose = () => {
    setIsPreviewModalOpen(false);
    setPreviewData(null);
  };

  // Prepare images for ImageSlider
  const sliderImages = Array.isArray(promotionals)
    ? promotionals.map((promotional) => ({
        url: `${BE_URL}${promotional.imageUrl}`,
        alt: promotional.altText,
      }))
    : [];

  // Debug slider images
  useEffect(() => {
    if (sliderImages.length > 0) {
      console.log("🔍 [DEBUG] Slider images:", sliderImages);
      console.log("🔍 [DEBUG] First image URL:", sliderImages[0]?.url);
      console.log("🔍 [DEBUG] Raw imageUrl from API:", promotionals[0]?.imageUrl);
    }
  }, [promotionals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Promotional Management
          </h1>
          <p className="text-gray-600">
            Manage promotional images displayed on the homepage slider
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Promotional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Promotional Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={formData.altText}
                  onChange={(e) =>
                    setFormData({ ...formData, altText: e.target.value })
                  }
                  placeholder="Enter alt text for the image"
                />
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePromotional}
                  disabled={
                    loading || !formData.image || !formData.altText.trim()
                  }
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCreateModalClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {loading && promotionals.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading promotional images...</p>
        </div>
      )}

      {/* Image Slider Preview */}
      {!loading && Array.isArray(promotionals) && promotionals.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="h-5 w-5 text-blue-600 mr-2" />
              Homepage Slider Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageSlider images={sliderImages} autoSlideInterval={4000} />
          </CardContent>
        </Card>
      )}

      {/* Promotional Images Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(promotionals) &&
            promotionals.map((promotional) => (
              <Card key={promotional.id} className="overflow-hidden">
                <div className="aspect-video relative group">
                  <img
                    src={`${BE_URL}${promotional.imageUrl}`}
                    alt={promotional.altText}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePreviewClick(promotional)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditClick(promotional)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePromotional(promotional.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {promotional.altText}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Created:{" "}
                    {new Date(promotional.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {!loading && Array.isArray(promotionals) && promotionals.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Promotional Images
          </h3>
          <p className="text-gray-600 mb-4">
            Add promotional images to display on the homepage slider
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Promotional
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Promotional Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editAltText">Alt Text</Label>
              <Input
                id="editAltText"
                value={formData.altText}
                onChange={(e) =>
                  setFormData({ ...formData, altText: e.target.value })
                }
                placeholder="Enter alt text for the image"
              />
            </div>
            <div>
              <Label htmlFor="editImage">New Image (optional)</Label>
              <Input
                id="editImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
              {selectedPromotional && !imagePreview && (
                <div className="mt-2">
                  <img
                    src={`${BE_URL}${selectedPromotional.imageUrl}`}
                    alt="Current"
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdatePromotional}
                disabled={loading || !formData.altText.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleEditModalClose}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Promotional Image</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="aspect-video">
                <img
                  src={`${BE_URL}${previewData.imageUrl}`}
                  alt={previewData.altText}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  {previewData.altText}
                </p>
                <p className="text-sm text-gray-500">
                  Created:{" "}
                  {new Date(previewData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Promotional;