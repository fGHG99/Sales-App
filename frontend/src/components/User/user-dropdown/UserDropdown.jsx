import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import UserCard from "./UserCard";
import ProfileCompletion from "./ProfileCompletion";
import AddressSection from "./AddressSection";
import LogoutModal from "../../modal/logout-confirmation";
import api from "../../../utils/api";

const UserDropdown = ({ userData, onClose, onConfirm }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate(); // Tambahkan ini

  const user = userData;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call the logout API endpoint
      const response = await api.post("/auth/logout");
      console.log("Logout response:", response.data);

      // Clear local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Close the modal
      setShowLogoutModal(false);
      console.log("clicked logot")

      // Call onConfirm if provided, otherwise redirect manually
      if (onConfirm) {
        onConfirm();
      } else {
        // Force redirect to login page
        navigate("/auth/login", { replace: true });
        // Atau jika Anda pakai React Router:
        // window.location.replace('/login');
      }
    } catch (error) {
      console.error("Logout API error:", error);

      // Even if API call fails, clear local data and logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Close the modal
      setShowLogoutModal(false);

      // Redirect
      if (onConfirm) {
        onConfirm();
      } else {
        window.location.href = "/login";
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Dropdown Menu */}
      <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* User Card Section */}
        <UserCard userData={user} />

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Profile Completion Section */}
        <ProfileCompletion userData={user} />

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Address Section */}
        <AddressSection />

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Logout Section */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-200 group cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
};

export default UserDropdown;
