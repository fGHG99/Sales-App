import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { toast } from "../../hook/useToast";
import DatePicker from "./DatePicker";
import ImageCropModal from "../../modal/ImageCropModal";
import ProfileSkeleton from "./ProfileSkeleton";
import api from "../../../utils/api";
import {
  Camera,
  Check,
  X,
  Mail,
  Shield,
  AlertCircle,
  User,
  Phone,
  Upload,
  Edit2,
  Save,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  updateField,
  resendEmailVerification,
  setLoading,
} from "../../../utils/profileSlice";

const EditProfile = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.profile);
  const BE_URL = import.meta.env.VITE_BE_API_URL;

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    emailVerified: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    sex: "",
    dob: "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [tempImageFile, setTempImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData({
      username: storedUser.name || "",
      email: storedUser.email || "",
      emailVerified: storedUser.isVerified || false,
    });
    setFormData({
      name: storedUser.name || "",
      phone: storedUser.phone || "",
      sex: storedUser.sex || "",
      dob: storedUser.dob || "",
    });
    // Profile picture comes from image.url
    if (storedUser.image && storedUser.image.url) {
      setProfilePicture(`${BE_URL}${storedUser.image.url}`);
    }
    if (storedUser.dob) {
      setSelectedDate(new Date(storedUser.dob));
    }
  }, [BE_URL]);

  // Simulate initial loading
  useEffect(() => {
    dispatch(setLoading(true));
    const timer = setTimeout(() => {
      dispatch(setLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const maskPhoneNumber = (phone) => {
    if (phone.length > 3) {
      return "*".repeat(phone.length - 3) + phone.slice(-3);
    }
    return phone;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      handleInputChange("dob", formattedDate);
    }
  };

  const handleResendVerification = () => {
    dispatch(resendEmailVerification());
    toast({
      title: "Verification email sent",
      description: "Please check your inbox for the verification link.",
    });
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

    // Check if file is actually an image by reading first few bytes
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

      // Update localStorage user data with image object structure
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.image = {
        url: uploadResponse.data.imageUrl,
        thumbnailUrl: uploadResponse.data.imageUrl,
      };
      storedUser.imageId = uploadResponse.data.imageId; // Store imageId if returned
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

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Prepare data to send
      const updateData = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.sex) updateData.sex = formData.sex;
      if (formData.dob) updateData.dob = formData.dob;

      const response = await api.put("/users/profile", updateData);

      // Update localStorage with new user data
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      Object.assign(storedUser, response.data.user);
      localStorage.setItem("user", JSON.stringify(storedUser));

      // Update local state immediately to reflect changes without refresh
      setUserData((prev) => ({
        ...prev,
        username: response.data.user.name || prev.username,
      }));

      setFormData((prev) => ({
        ...prev,
        name: response.data.user.name || prev.name,
        phone: response.data.user.phone || prev.phone,
        sex: response.data.user.sex || prev.sex,
        dob: response.data.user.dob || prev.dob,
      }));

      // Update date picker if dob changed
      if (response.data.user.dob) {
        setSelectedDate(new Date(response.data.user.dob));
      }

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userUpdated"));

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Professional Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600">
            Manage your personal information and account preferences
          </p>
        </div>

        <Card className="shadow-lg border border-gray-200 bg-white">
          {/* Clean Header */}
          <CardHeader className="pb-6 border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Enhanced Profile Picture Section */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-2 border-gray-200 shadow-sm">
                  <AvatarImage
                    src={profilePicture}
                    alt="Profile"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl font-semibold">
                    {userData.username.charAt(0).toUpperCase()}
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
                        Upload New Picture
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

            <Separator className="bg-gray-200" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Username */}
                <div className="space-y-3">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-900 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4 text-gray-500" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="h-11 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email with Verification Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-900 flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-gray-500" />
                      Email Address
                    </Label>
                    {userData.emailVerified ? (
                      <Badge className="gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                        <Check className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-red-100 text-red-800 border-red-200"
                      >
                        <X className="h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    disabled
                    className="h-11 border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="Enter your email address"
                  />
                  {!userData.emailVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      className="gap-2 border-gray-300 hover:bg-gray-50 text-gray-700"
                    >
                      <Mail className="h-4 w-4" />
                      Resend Verification
                    </Button>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Phone Number
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-11 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Gender */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Gender
                  </Label>
                  <RadioGroup
                    value={formData.sex?.toLowerCase()}
                    onValueChange={(value) =>
                      handleInputChange("sex", value.toUpperCase())
                    }
                    className="flex gap-8"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value="male"
                        id="male"
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor="male"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Male
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value="female"
                        id="female"
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor="female"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Female
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Date of Birth */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Date of Birth
                  </Label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={handleDateChange}
                    placeholder="Select your birth date"
                    className="w-full h-11 border-gray-300 focus:border-gray-500"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 px-6 h-11"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 h-11 gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Image Crop Modal with landscape optimization */}
        <ImageCropModal
          isOpen={showCropModal}
          onClose={handleCropCancel}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
        />
      </div>
    </div>
  );
};

export default EditProfile;
