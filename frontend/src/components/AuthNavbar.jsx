import { Link } from "react-router-dom";
import { Bell, Receipt, User } from "lucide-react";

export default function AuthSection({ isAuthenticated, user }) {
  return (
    <div className="flex items-center space-x-3">
      {!isAuthenticated ? (
        <>
          <Link
            to="/auth/signin"
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-inter font-medium"
          >
            Masuk
          </Link>

          <Link
            to="/auth/signup"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-inter font-medium"
          >
            Daftar
          </Link>
        </>
      ) : (
        <>
          {/* Notification */}
          <button
            type="button"
            className="p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Order History */}
          <Link
            to="/orders"
            className="p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            <Receipt className="w-5 h-5" />
          </Link>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* User Menu */}
          <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="font-inter text-sm text-gray-700">
              {user?.name || "User"}
            </span>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
