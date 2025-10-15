import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Store,
  Users,
  BarChart3,
  Shield,
  Package,
  DollarSign,
  Settings,
  FileText,
  ClipboardList,
  X,
} from "lucide-react";
import { Button } from "../../ui/button";

const SuperAdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navigationItems = [
    { id: "overview", label: "Overview", icon: BarChart3, href: "/s-admin" },
    {
      id: "stores",
      label: "Store Management",
      icon: Store,
      href: "/s-admin/stores",
    },
    // {
    //   id: "accounts",
    //   label: "Account Management",
    //   icon: Users,
    //   href: "/s-admin/accounts",
    // },
    // {
    //   id: "roles",
    //   label: "Role Management",
    //   icon: Shield,
    //   href: "/s-admin/roles",
    // },
    { id: "fees", label: "Fee Setup", icon: DollarSign, href: "/s-admin/fees" },
    // {
    //   id: "system",
    //   label: "System Configuration",
    //   icon: Settings,
    //   href: "/s-admin/system",
    // },
    {
      id: "reports",
      label: "Global Reports",
      icon: FileText,
      href: "/s-admin/reports",
    },
    // {
    //   id: "audit",
    //   label: "Audit Log",
    //   icon: ClipboardList,
    //   href: "/s-admin/audit",
    // },
  ];

  const isActiveRoute = (href) => {
    if (href === "/s-admin") {
      return location.pathname === "/s-admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">SuperAdmin</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
