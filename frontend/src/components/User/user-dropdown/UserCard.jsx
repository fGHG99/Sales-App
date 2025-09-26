import React from "react";
import { Settings, User } from "lucide-react";

const UserCard = ({ userData }) => {
  const handleSettingsClick = () => {
    // Navigate to /user/profile
    window.location.href = "/user/profile";
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center flex-shrink-0">
          {userData.avatar ? (
            <img
              src={userData.avatar}
              alt={userData.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/assets/user_icon.png"
                alt="User"
                className="w-12 h-12 object-contain"
              />
            </div>
          )}
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
