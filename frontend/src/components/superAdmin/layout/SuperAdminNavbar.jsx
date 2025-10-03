import React from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const SuperAdminNavbar = ({ setSidebarOpen }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;

    switch (path) {
      case "/s-admin":
        return "Overview";
      case "/s-admin/stores":
        return "Store Management";
      case "/s-admin/accounts":
        return "Account Management";
      case "/s-admin/roles":
        return "Role Management";
      case "/s-admin/orders":
        return "Order Management";
      case "/s-admin/products":
        return "Product Management";
      case "/s-admin/fees":
        return "Fee Setup";
      case "/s-admin/system":
        return "System Configuration";
      case "/s-admin/reports":
        return "Global Reports";
      case "/s-admin/audit":
        return "Audit Log";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Super Admin
          </Badge>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">SA</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminNavbar;
