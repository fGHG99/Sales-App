import { Link } from "react-router-dom";

export default function AuthSection({
  isAuthenticated,
  user,
  handleCartClick,
}) {
  return (
    <div
      className={`flex items-center ${
        isAuthenticated ? "space-x-2" : "space-x-4"
      }`}
    >
      {/* Cart Section (shared) */}
      <button
        onClick={handleCartClick}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        aria-label="Shopping cart"
      >
        <img
          src="/assets/cart_icon.png"
          alt="Cart"
          className="w-6 h-6 object-contain"
        />
      </button>

      {/* Auth Section */}
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
          <Link
            to="/notifications"
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <img
              src="/assets/notification_icon.png"
              alt="Notification"
              className="w-6 h-6 object-contain"
            />
          </Link>

          {/* Order History */}
          <Link
            to="/orders"
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <img
              src="/assets/order_icon.png"
              alt="Orders"
              className="w-6 h-6 object-contain"
            />
          </Link>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* User Menu */}
          <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 overflow-hidden">
              <img
                src="/assets/user_icon.png"
                alt="User"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-regular text-sm text-gray-700 ml-2 overflow-hidden whitespace-nowrap">
              {(() => {
                const name = user?.name || "User";
                return name.length > 4 ? name.slice(0, 4) + "..." : name;
              })()}
            </span>

            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </>
      )}
    </div>
  );
}
