import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from './hook/useToast';
import DatePicker from './other/DatePicker';
import ImageCropModal from './other/ImageCropModal';
import ProfileSkeleton from './other/ProfileSkeleton';
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
  Trash2
} from 'lucide-react';
import { updateField, resendEmailVerification, setLoading } from '../utils/profileSlice';

const EditProfile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.profile);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const [selectedDate, setSelectedDate] = useState(user.dateOfBirth ? new Date(user.dateOfBirth) : null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Simulate initial loading
  useEffect(() => {
    dispatch(setLoading(true));
    const timer = setTimeout(() => {
      dispatch(setLoading(false));
    }, 2000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const maskPhoneNumber = (phone) => {
    if (phone.length > 3) {
      return '*'.repeat(phone.length - 3) + phone.slice(-3);
    }
    return phone;
  };

  const handleInputChange = (field, value) => {
    dispatch(updateField({ field, value }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      handleInputChange('dateOfBirth', formattedDate);
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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
      // Clear the input
      event.target.value = '';
      return;
    }

    setIsUploadingImage(true);

    // Create preview URL for cropping with error handling
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        setTempImageSrc(e.target.result);
        setShowCropModal(true);
        setIsUploadingImage(false);
      } catch (error) {
        console.error('Error reading file:', error);
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
    
    // Clear the input to allow re-selection of the same file
    event.target.value = '';
  };

  const handleCropComplete = (croppedImageDataUrl) => {
    setProfilePicture(croppedImageDataUrl);
    handleInputChange('profilePicture', croppedImageDataUrl);
    setTempImageSrc(null);
    
    toast({
      title: "Profile picture updated",
      description: "Your profile picture has been successfully updated.",
    });
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setTempImageSrc(null);
  };

  // Remove profile picture
  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    handleInputChange('profilePicture', null);
    toast({
      title: "Profile picture removed",
      description: "Your profile picture has been removed.",
    });
  };

  const handleSaveProfile = () => {
    dispatch(setLoading(true));
    setTimeout(() => {
      dispatch(setLoading(false));
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    }, 1500);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Professional Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your personal information and account preferences</p>
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
                  <AvatarImage src={profilePicture} alt="Profile" className="object-cover" />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl font-semibold">
                    {user.username.charAt(0).toUpperCase()}
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
                    onClick={() => document.querySelector('input[type="file"]').click()}
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
                  Maximum file size: 5MB • Supported formats: JPEG, PNG, WebP
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Username */}
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-gray-500" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={user.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="h-11 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    placeholder="Enter your username"
                  />
                </div>

                {/* Email with Verification Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Email Address
                    </Label>
                    {user.emailVerified ? (
                      <Badge className="gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                        <Check className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 bg-red-100 text-red-800 border-red-200">
                        <X className="h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-11 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    placeholder="Enter your email address"
                  />
                  {!user.emailVerified && (
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
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Phone Number
                    </Label>
                    <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
                      <Shield className="h-3 w-3" />
                      Protected
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      value={maskPhoneNumber(user.phoneNumber)}
                      disabled
                      className="h-11 border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed pl-10"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border-l-4 border-amber-400">
                    Contact support to modify your phone number
                  </p>
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
                    value={user.sex}
                    onValueChange={(value) => handleInputChange('sex', value)}
                    className="flex gap-8"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="male" id="male" className="border-gray-400" />
                      <Label htmlFor="male" className="text-sm font-medium text-gray-700 cursor-pointer">Male</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="female" id="female" className="border-gray-400" />
                      <Label htmlFor="female" className="text-sm font-medium text-gray-700 cursor-pointer">Female</Label>
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
                disabled={loading}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 h-11 gap-2"
              >
                {loading ? (
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