import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Settings, FileText, BarChart3 } from "lucide-react";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: "accounts",
      path: "/support/accounts",
      label: "Account Management",
      icon: Users,
      badge: null,
    },
    {
      id: "roles",
      path: "/support/roles",
      label: "Role Management",
      icon: Shield,
      badge: null,
    },
    {
      id: "audit",
      path: "/support/audit",
      label: "Audit Log",
      icon: FileText,
      badge: null,
    },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 flex flex-col h-screen
      `}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b border-gray-200 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">IT Support</h2>
              <p className="text-xs text-gray-500">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleMenuClick(item.path)}
                className={`
                  w-full justify-start px-3 py-2.5 h-auto transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="outline"
                    className={`ml-auto text-xs ${
                      item.badge === "New"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
