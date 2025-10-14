import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, X, LogOut, User } from "lucide-react";
import { useToast } from "@/components/hook/useToast";
import { getCurrentUser } from "@/services/supportService";
import { useAuth } from "@/components/middleware/AuthContext";
import LogoutModal from "@/components/modal/logout-confirmation";

const Navbar = ({ isSidebarOpen, toggleSidebar }) => {
  const { toast } = useToast();
  const { handleLogout } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch current user data on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await getCurrentUser();

      setCurrentUser(response.user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return "U";
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
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between h-16">
      {/* Left side - Menu toggle and title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-gray-900">
            IT Support Dashboard
          </h1>
          <p className="text-sm text-gray-500">System Management Portal</p>
        </div>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="flex items-center gap-3 p-2">
            <div className="hidden md:block text-right space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ) : currentUser ? (
          /* User Profile Dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 p-2 hover:bg-gray-50"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={currentUser.profilePicture}
                    alt={currentUser.name}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getUserInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2">
                <p className="font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
                {currentUser.role && (
                  <Badge variant="outline" className="mt-1">
                    {currentUser.role.name || currentUser.role.roleType}
                  </Badge>
                )}
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
          /* Error State - Show Generic User */
          <Button variant="ghost" className="flex items-center gap-3 p-2">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">User</p>
              <p className="text-xs text-gray-500">Not loaded</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-100 text-gray-600">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={handleLogoutModalClose}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </nav>
  );
};

export default Navbar;
