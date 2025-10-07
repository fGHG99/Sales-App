import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
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
} from "lucide-react";
import { mockCourier, getTodaysStats } from "../../../utils/mockDataCourier";
import LogoutModal from "../../modal/logout-confirmation";
import api from "../../../utils/api";

const ProfilePage = () => {
  const courier = mockCourier;
  const stats = getTodaysStats();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = async () => {
    try {
      console.log("🔵 [CourierProfile] confirmLogout started");
      setIsLoggingOut(true);

      // Call the logout API endpoint
      console.log("🔵 [CourierProfile] Calling POST /auth/logout...");
      const response = await api.post("/auth/logout");
      console.log("✅ [CourierProfile] Logout API successful:", response.data);

      // Clear local storage
      console.log("🔵 [CourierProfile] Clearing localStorage...");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      console.log("✅ [CourierProfile] localStorage cleared");

      // Close the modal
      setLogoutOpen(false);

      // Redirect to signin page
      console.log("🔵 [CourierProfile] Redirecting to /auth/signin...");
      navigate("/auth/signin");
      console.log("✅ [CourierProfile] Logout complete");
    } catch (error) {
      console.error("❌ [CourierProfile] Logout API error:", error);

      // Even if API call fails, clear local data and logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Close the modal
      setLogoutOpen(false);

      // Redirect
      navigate("/auth/signin");
    } finally {
      setIsLoggingOut(false);
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
        { label: "Employee ID", value: courier.employeeId, icon: Package },
      ],
    },
    {
      title: "Work Information",
      icon: Truck,
      fields: [
        { label: "Work Location", value: courier.workLocation, icon: MapPin },
        { label: "Post Code", value: courier.postCode, icon: MapPin },
        { label: "Vehicle Type", value: courier.vehicleType, icon: Truck },
        { label: "License Number", value: courier.licenseNumber, icon: Key },
      ],
    },
    {
      title: "Employment Details",
      icon: Calendar,
      fields: [
        {
          label: "Join Date",
          value: new Date(courier.joinDate).toLocaleDateString(),
          icon: Calendar,
        },
        { label: "Employment Status", value: courier.status, icon: Package },
        {
          label: "Total Deliveries",
          value: courier.totalDeliveries.toLocaleString(),
          icon: Package,
        },
      ],
    },
  ];

  const performanceStats = [
    {
      label: "Today's Deliveries",
      value: stats.completedDeliveries,
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "Active Orders",
      value: stats.pendingDeliveries,
      icon: Package,
      color: "text-green-600",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              View your profile information and performance statistics
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button variant="destructive" onClick={() => setLogoutOpen(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
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
                {section.fields.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <field.icon className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="font-medium text-gray-700">
                        {field.label}
                      </span>
                    </div>
                    <div className="text-right">
                      {field.label === "Employment Status" ? (
                        <Badge
                          className={
                            field.value === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {field.value}
                        </Badge>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {field.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Security Section */}
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
                <Link to="/courier/forgot-password">
                  <Button size="sm" variant="outline">
                    Change Password
                  </Button>
                </Link>
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

        {/* Performance Stats Sidebar */}
        <div className="space-y-6">
          {/* Today's Performance */}
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
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
