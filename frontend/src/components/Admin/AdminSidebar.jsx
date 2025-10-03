import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, navigation }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 sticky top-0 bg-white z-10 relative">
          <img
            src="/image/logo-crop.png"
            alt="Geek Sales Admin"
            className="h-8 w-auto ml-[-10px]"
          />

          {/* Mobile toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden absolute right-6 top-1/2 -translate-y-1/2 z-20"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            ) : (
              <ChevronRight className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 pb-6 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                data-testid={`nav-${item.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop toggle button */}
        <div className="hidden lg:flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
