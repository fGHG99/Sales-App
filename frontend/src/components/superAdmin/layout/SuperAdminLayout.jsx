import React, { useState } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminNavbar from "./SuperAdminNavbar";

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SuperAdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <SuperAdminNavbar setSidebarOpen={setSidebarOpen} />

        {/* Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>

        <ScrollRestoration />
      </div>
    </div>
  );
};

export default SuperAdminLayout;
