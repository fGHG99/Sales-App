import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui//button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui//avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Truck,
  Package,
  Lock,
  Key,
  LogOut,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
} from "lucide-react";
import LogoutModal from "../../modal/logout-confirmation";
import ChangePasswordModal from "../modal/ChangePasswordModal";
import ImageCropModal from "../../modal/ImageCropModal";
import { getCourierProfile } from "@/services/courierService";
import api from "@/utils/api";

const ProfilePage = () => {
  const [courier, setCourier] = useState({});
  const [stats, setStats] = useState({});
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const BE_URL = import.meta.env.VITE_BE_API_URL || process.env.REACT_APP_BACKEND_URL;

  // Profile picture states
  const [profilePicture, setProfilePicture] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [tempImageFile, setTempImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const fetchCourierData = async () => {
      try {
        const response = await getCourierProfile();
        setCourier(response.courier);
        setStats(response.stats);

        // Set profile picture from image.url
        if (response.courier.image && response.courier.image.url) {
          setProfilePicture(`${BE_URL}${response.courier.image.url}`);
          console.log("✅ Profile picture loaded:", response.courier.image.url);
        } else {
          setProfilePicture(null);
        }
      } catch (error) {
        console.error(
          "❌ [ProfilePage] Failed to fetch courier profile:",
          error
        );
      }
    };
    fetchCourierData();
  }, [BE_URL]);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await api.post("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setLogoutOpen(false);
      navigate("/auth/signin");
    } catch (error) {
      console.error("❌ Logout error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setLogoutOpen(false);
      navigate("/auth/signin");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Enhanced file validation
  const validateImageFile = (file) => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File size too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }

    // Check file type with more comprehensive validation
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please select a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    setTempImageFile(file);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        setTempImageSrc(e.target.result);
        setShowCropModal(true);
        setIsUploadingImage(false);
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          title: "Error reading file",
          description: "Please try selecting the image again.",
          variant: "destructive",
        });
        setIsUploadingImage(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Unable to process the selected image.",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCropComplete = async (croppedImageDataUrl) => {
    try {
      setIsUploadingImage(true);

      // Convert data URL to File
      const response = await fetch(croppedImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], tempImageFile.name, { type: blob.type });

      // Upload to backend
      const formData = new FormData();
      formData.append("profilePicture", file);

      const uploadResponse = await api.post(
        "/users/profile/picture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Update profile picture with backend URL (immediate UI update)
      const imageUrl = `${BE_URL}${uploadResponse.data.imageUrl}`;
      setProfilePicture(imageUrl);

      // Update courier state with image object structure
      setCourier((prev) => ({
        ...prev,
        image: {
          url: uploadResponse.data.imageUrl,
          thumbnailUrl: uploadResponse.data.imageUrl,
        },
        imageId: uploadResponse.data.imageId,
      }));

      // Update localStorage courier data with image object structure
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.image = {
        url: uploadResponse.data.imageUrl,
        thumbnailUrl: uploadResponse.data.imageUrl,
      };
      storedUser.imageId = uploadResponse.data.imageId;
      localStorage.setItem("user", JSON.stringify(storedUser));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userUpdated"));

      setTempImageSrc(null);
      setTempImageFile(null);
      setIsUploadingImage(false);

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully uploaded.",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setIsUploadingImage(false);
      toast({
        title: "Upload failed",
        description:
          error.response?.data?.error ||
          "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setTempImageSrc(null);
  };

  // Remove profile picture
  const handleRemoveProfilePicture = async () => {
    try {
      await api.delete("/users/profile/picture");

      setProfilePicture(null);

      // Update courier state - remove image object
      setCourier((prev) => ({
        ...prev,
        image: null,
        imageId: null,
      }));

      // Update localStorage - remove image object
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.image = null;
      storedUser.imageId = null;
      localStorage.setItem("user", JSON.stringify(storedUser));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userUpdated"));

      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error("Error removing profile picture:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to remove profile picture.",
        variant: "destructive",
      });
    }
  };

  const profileSections = [
    {
      title: "Personal Information",
      icon: User,
      fields: [
        { label: "Full Name", value: courier.name, icon: User },
        { label: "Email", value: courier.email, icon: Mail },
        { label: "Phone", value: courier.phone, icon: Phone },
        {
          label: "Employee ID",
          value: courier.id ? courier.id.substring(0, 8).toUpperCase() : "-",
          icon: Package,
        },
      ],
    },
    {
      title: "Work Information",
      icon: Truck,
      fields: [
        {
          label: "Postal Code",
          value: courier?.workAreaPostalCodes?.join(", "),
          icon: MapPin,
        },
      ],
    },
    {
      title: "Employment Details",
      icon: Calendar,
      fields: [
        {
          label: "Join Date",
          value: courier.createdAt
            ? new Date(courier.createdAt).toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta",
              })
            : "-",
          icon: Calendar,
        },
        {
          label: "Total Deliveries",
          value: stats.totalDeliveries?.toLocaleString() || 0,
          icon: Package,
        },
      ],
    },
  ];

  const performanceStats = [
    {
      label: "Today's Deliveries",
      value: stats.todayDeliveries || 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders || 0,
      icon: Package,
      color: "text-green-600",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            View your profile information and performance statistics
          </p>
        </div>
        <Button variant="destructive" onClick={() => setLogoutOpen(true)}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Enhanced Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={handleCropCancel}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {profileSections.map((section, index) => (
            <Card key={index}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <section.icon className="h-5 w-5 text-blue-600 mr-2" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <field.icon className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="font-medium text-gray-700">
                        {field.label}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {field.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Lock className="h-5 w-5 text-blue-600 mr-2" />
                Security & Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <Key className="h-4 w-4 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-700">Password</p>
                    <p className="text-sm text-gray-500">
                      Last updated 30 days ago
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      Profile Information
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your profile information is read-only. Contact your
                      administrator if you need to update any personal details.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Today's Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <stat.icon className={`h-4 w-4 mr-2 ${stat.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {stat.label}
                    </span>
                  </div>
                  <span className={`font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 📸 Profile Picture Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-2 border-gray-200 shadow-sm">
                    <AvatarImage
                      src={profilePicture}
                      alt="Profile"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl font-semibold">
                      {courier.name ? courier.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Hover overlay with loading state */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingImage ? (
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-1"></div>
                        <span className="text-xs font-medium">Processing...</span>
                      </div>
                    ) : (
                      <div className="text-white text-center">
                        <Camera className="h-6 w-6 mx-auto mb-1" />
                        <span className="text-xs font-medium">Change</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleProfilePictureChange}
                    disabled={isUploadingImage}
                    className="absolute inset-0 opacity-0 cursor-pointer rounded-full disabled:cursor-not-allowed"
                  />
                </div>

                <div className="text-center space-y-4">
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-gray-300 hover:bg-gray-50"
                      onClick={() =>
                        document.querySelector('input[type="file"]').click()
                      }
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload New
                        </>
                      )}
                    </Button>

                    {profilePicture && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700"
                        onClick={handleRemoveProfilePicture}
                        disabled={isUploadingImage}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    Maximum file size: 200KB
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
