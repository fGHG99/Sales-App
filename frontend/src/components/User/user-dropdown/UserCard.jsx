import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import api from "../../../utils/api";

const UserCard = ({ userData: initialUserData }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [userData, setUserData] = useState(initialUserData);
  const BE_URL = import.meta.env.VITE_BE_API_URL;
  const navigate = useNavigate();

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/users/me");
        const fetchedUser = response.data.user;

        setUserData(fetchedUser);

        // Set profile picture
        if (fetchedUser.image && fetchedUser.image.url) {
          setProfilePicture(`${BE_URL}${fetchedUser.image.url}`);
        } else {
          setProfilePicture(null);
        }

        console.log("✅ UserCard: User data fetched from API");
      } catch (error) {
        console.error("❌ UserCard: Failed to fetch user data:", error);
        // Fallback to props or localStorage
        const user =
          initialUserData || JSON.parse(localStorage.getItem("user") || "{}");
        setUserData(user);
        if (user.image && user.image.url) {
          setProfilePicture(`${BE_URL}${user.image.url}`);
        }
      }
    };

    fetchUserData();

    // Listen for custom event when user updates profile
    const handleUserUpdate = () => {
      fetchUserData();
    };

    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, [BE_URL, initialUserData]);

  const user = userData || {
    name: "User",
    email: "user@example.com",
  };

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
          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
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
