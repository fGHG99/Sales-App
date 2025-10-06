import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

const UserCard = ({ userData }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const BE_URL = import.meta.env.VITE_BE_API_URL;
  const user = userData || {
    name: "User",
    email: "user@example.com",
  };
  const navigate = useNavigate();

  // Load profile picture from localStorage
  useEffect(() => {
    const loadProfilePicture = () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser.image && storedUser.image.url) {
        setProfilePicture(`${BE_URL}${storedUser.image.url}`);
      } else {
        setProfilePicture(null);
      }
    };

    loadProfilePicture();

    // Listen for storage changes (when profile picture is updated in EditProfile)
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === null) {
        loadProfilePicture();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab updates
    const handleUserUpdate = () => {
      loadProfilePicture();
    };

    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, [BE_URL]);

  const handleSettingsClick = () => {
    navigate("/user/profile");
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={profilePicture}
              alt="Profile"
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {userData.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">{userData.email}</p>
        </div>
        <button
          onClick={handleSettingsClick}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          title="Profile Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UserCard;
