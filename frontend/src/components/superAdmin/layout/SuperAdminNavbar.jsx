import React, { useState, useEffect } from "react";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Skeleton } from "../../ui/skeleton";
import { useToast } from "../../hook/useToast";
import { useAuth } from "../../middleware/AuthContext";
import LogoutModal from "../../modal/logout-confirmation";

const SuperAdminNavbar = ({ setSidebarOpen }) => {
  const { toast } = useToast();
  const { handleLogout, user } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return "SA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Handle logout button click - open modal
  const handleLogoutClick = () => {
    console.log("🔓 Sign Out clicked - opening logout modal");
    setIsLogoutModalOpen(true);
  };

  // Handle logout confirmation
  const handleLogoutConfirm = async () => {
    try {
      console.log("✅ Logout confirmed");
      setIsLoggingOut(true);

      // Call handleLogout from AuthContext
      handleLogout();

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    } finally {
      setIsLogoutModalOpen(false);
    }
  };

  // Handle logout modal close
  const handleLogoutModalClose = () => {
    console.log("❌ Logout cancelled - closing modal");
    setIsLogoutModalOpen(false);
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
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            /* User Profile Dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 p-2 hover:bg-gray-50"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePicture} alt={user.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <Badge variant="outline" className="mt-1">
                    Super Admin
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogoutClick}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Loading State - Show Generic User */
            <Button variant="ghost" className="flex items-center gap-3 p-2">
              <div className="hidden md:block text-right">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={handleLogoutModalClose}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </header>
  );
};

export default SuperAdminNavbar;
