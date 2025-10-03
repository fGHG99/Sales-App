import React, { useState } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { Package, Truck, MessageCircle, BarChart3, Home } from "lucide-react";
import AdminNavbar from "./AdminNavbar";
import AdminFooter from "./AdminFooter";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Order Management", href: "/admin/orders", icon: Package },
    { name: "Courier Tracking", href: "/admin/couriers", icon: Truck },
    { name: "Disputes", href: "/admin/disputes", icon: MessageCircle },
    { name: "Sales Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  const handleSearchSelect = (item, type) => {
    // Handle selection of search result - navigate to appropriate page or perform action
    console.log("Selected search result:", item, "Type:", type);
    // You can add navigation logic here if needed
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navigation={navigation}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <AdminNavbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
          onSearchSelect={handleSearchSelect}
        />

        {/* Page content */}
        <main className="flex-1 py-6 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 max-w-full">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <AdminFooter />
        <ScrollRestoration />
      </div>
    </div>
  );
};

export default AdminLayout;
