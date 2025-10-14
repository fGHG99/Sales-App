import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import useDebounce from "@/components/hook/useDebounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/hook/useToast";
import {
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Clock,
  X,
  Search,
} from "lucide-react";
import WarningModal from "../modal/WarningModal";
import Pagination from "@/components/Pagination";
import AccountManagementSkeleton from "@/components/skeleton/AccountManagementSkeleton";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  searchUsers,
} from "@/services/supportService";

export default function AccountManagement() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [warningAction, setWarningAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    phone: "",
    sex: "",
    dob: "",
  });

  // Search functionality states
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchPagination, setSearchPagination] = useState(null);
  const [searchPage, setSearchPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [includeDeletedInSearch, setIncludeDeletedInSearch] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const itemsPerPage = 10;
  const RECENT_SEARCHES_KEY = "accountManagement_recentSearches";
  const MAX_RECENT_SEARCHES = 5;

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch users data when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, showDeleted]);

  // Fetch roles only once on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load recent searches:", error);
      }
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.trim().length >= 2) {
      performSearch(debouncedSearchQuery, includeDeletedInSearch, 1);
    } else if (
      !debouncedSearchQuery ||
      debouncedSearchQuery.trim().length === 0
    ) {
      // Clear search when query is empty
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchPagination(null);
    }
  }, [debouncedSearchQuery, includeDeletedInSearch]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await getUsers(
        currentPage,
        itemsPerPage,
        searchTerm,
        "", // roleId - empty for now
        showDeleted // includeDeleted parameter
      );

      if (response.success) {
        setAccounts(response.users);
        setTotalPages(response.pagination.totalPages);
        setTotalAccounts(response.pagination.total);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.error || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      if (response.success) {
        setRoles(response.roles);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const handlePageChange = (page) => {
    if (isSearchMode) {
      performSearch(searchQuery, includeDeletedInSearch, page);
    } else {
      setCurrentPage(page);
    }
  };

  // Perform search API call
  const performSearch = async (query, includeDeleted, page = 1) => {
    try {
      setIsSearching(true);
      setIsSearchMode(true);

      // Pass includeDeleted to API
      const response = await searchUsers(
        query,
        page,
        itemsPerPage,
        includeDeleted
      );

      if (response.success) {
        // API already handles filtering based on includeDeleted parameter
        // No need for client-side filtering
        setSearchResults(response.users);
        setSearchPagination(response.pagination);
        setSearchPage(page);
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: error.error || "Failed to search users",
        variant: "destructive",
      });
      setSearchResults([]);
      setSearchPagination(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchQuery(value);

    // Add to recent searches when user types (will be debounced)
    if (value && value.trim().length >= 2) {
      addToRecentSearches(value.trim());
    }

    // Search will be triggered by debounced effect
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchPagination(null);
    setIncludeDeletedInSearch(false);
  };

  // Add search query to recent searches
  const addToRecentSearches = (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item !== trimmedQuery);
      // Add to beginning
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save recent searches:", error);
      }

      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    toast({
      title: "Recent searches cleared",
      description: "Search history has been removed",
    });
  };

  // Handle click on recent search item
  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    // Search will be triggered by debounced effect
  };

  // Transform user data for display
  const transformUserData = (user) => ({
    ...user,
    username: user.name,
    role: user.role?.roleType || "N/A",
    roleObject: user.role,
    status: user.isVerified ? "active" : "inactive",
    // Ensure isDeleted is preserved from API response
    isDeleted: user.isDeleted || false,
  });

  // Display search results or normal accounts
  const displayAccounts = isSearchMode
    ? searchResults.map(transformUserData)
    : accounts.map(transformUserData);

  // Use search pagination if in search mode
  const activeTotalPages = isSearchMode
    ? searchPagination?.totalPages || 1
    : totalPages;
  const activeCurrentPage = isSearchMode ? searchPage : currentPage;
  const activeTotalCount = isSearchMode
    ? searchPagination?.total || 0
    : totalAccounts;

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: "bg-red-100 text-red-800 border-red-200",
      admin: "bg-blue-100 text-blue-800 border-blue-200",
      courier: "bg-green-100 text-green-800 border-green-200",
      user: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[role] || colors.user;
  };

  const getStatusBadgeColor = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const handleCreateAccount = () => {
    setWarningAction(() => async () => {
      try {
        const response = await createUser(newAccount);
        if (response.success) {
          setNewAccount({
            name: "",
            email: "",
            password: "",
            roleId: "",
            phone: "",
            sex: "",
            dob: "",
          });
          setIsCreateModalOpen(false);
          toast({
            title: "Account created successfully",
            description: `${response.user.name} has been added to the system.`,
          });
          fetchUsers(); // Refresh user list
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to create account",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount({
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone || "",
      sex: account.sex || "",
      dob: account.dob ? new Date(account.dob).toISOString().split("T")[0] : "",
      roleId: account.roleObject?.id || "",
      isVerified: account.status === "active",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAccount = () => {
    setWarningAction(() => async () => {
      try {
        const updateData = {
          name: selectedAccount.name,
          email: selectedAccount.email,
          phone: selectedAccount.phone,
          sex: selectedAccount.sex,
          dob: selectedAccount.dob,
          roleId: selectedAccount.roleId,
          isVerified: selectedAccount.isVerified,
        };

        const response = await updateUser(selectedAccount.id, updateData);
        if (response.success) {
          setIsEditModalOpen(false);
          toast({
            title: "Account updated successfully",
            description: `${response.user.name} has been updated.`,
          });
          fetchUsers(); // Refresh user list
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to update account",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  const handleDeleteAccount = (account) => {
    setWarningAction(() => async () => {
      try {
        const response = await deleteUser(account.id);
        if (response.success) {
          toast({
            title: "Account deleted successfully",
            description: `${account.username} has been removed from the system.`,
          });
          fetchUsers(); // Refresh user list
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to delete account",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Account Management
          </h2>
          <p className="text-slate-600">
            Manage user accounts and their permissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isSearchMode && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showDeleted"
                checked={showDeleted}
                onChange={(e) => {
                  setShowDeleted(e.target.checked);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label
                htmlFor="showDeleted"
                className="text-sm font-medium text-slate-700"
              >
                Include deleted accounts
              </Label>
            </div>
          )}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Account
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users by name (min 2 characters)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Include Deleted Checkbox */}
            {searchQuery && searchQuery.trim().length >= 2 && (
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  id="includeDeletedSearch"
                  checked={includeDeletedInSearch}
                  onChange={(e) => setIncludeDeletedInSearch(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label
                  htmlFor="includeDeletedSearch"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Include deleted
                </Label>
              </div>
            )}
          </div>

          {/* Search Info */}
          {isSearching && (
            <div className="text-xs text-slate-600">
              <span>Searching...</span>
            </div>
          )}

          {!isSearching && isSearchMode && searchQuery && (
            <div className="text-xs text-slate-600">
              <span>
                Found {activeTotalCount} result
                {activeTotalCount !== 1 ? "s" : ""} for "{searchQuery}"
                {includeDeletedInSearch && " (including deleted accounts)"}
              </span>
            </div>
          )}

          {searchQuery &&
            searchQuery.trim().length > 0 &&
            searchQuery.trim().length < 2 && (
              <p className="text-xs text-amber-600">
                Please enter at least 2 characters to search
              </p>
            )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && !searchQuery && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Recent Searches
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentSearchClick(search)}
                    className="h-7 text-xs bg-white hover:bg-blue-50"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {isLoading || isSearching ? (
        <AccountManagementSkeleton count={itemsPerPage} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {isSearchMode ? "Search Results" : "User Accounts"}
            </CardTitle>
            <CardDescription>
              Total {isSearchMode ? "results" : "accounts"}: {activeTotalCount}
              {(showDeleted || includeDeletedInSearch) &&
                displayAccounts.filter((acc) => acc.isDeleted).length > 0 &&
                ` (${
                  displayAccounts.filter((acc) => acc.isDeleted).length
                } deleted)`}{" "}
              {activeTotalPages > 1 &&
                `| Page ${activeCurrentPage} of ${activeTotalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className={
                      account.isDeleted
                        ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            account.isDeleted
                              ? "text-gray-500 line-through"
                              : ""
                          }
                        >
                          {account.username}
                        </span>
                        {account.isDeleted && (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 border-red-300 text-xs font-semibold"
                          >
                            DELETED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={account.isDeleted ? "text-gray-500" : ""}
                    >
                      {account.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(account.role)}>
                        {account.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(account.status)}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={account.isDeleted ? "text-gray-500" : ""}
                    >
                      {new Date(account.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={account.isDeleted}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditAccount(account)}
                            disabled={account.isDeleted}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAccount(account)}
                            className="text-red-600"
                            disabled={account.isDeleted}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {account.isDeleted ? "Already Deleted" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Empty state */}
            {displayAccounts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No accounts found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {isSearchMode
                    ? `No accounts match your search "${searchQuery}"`
                    : searchTerm
                    ? `No accounts match your search "${searchTerm}"`
                    : "Get started by creating your first account"}
                </p>
                {!searchTerm && !isSearchMode && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Account
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {activeTotalPages > 1 && displayAccounts.length > 0 && (
              <Pagination
                currentPage={activeCurrentPage}
                totalPages={activeTotalPages}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Account Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new user account to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newAccount.name}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, name: e.target.value })
                }
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newAccount.email}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAccount.password}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, password: e.target.value })
                }
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={newAccount.phone}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="sex">Gender (Optional)</Label>
              <Select
                value={newAccount.sex}
                onValueChange={(value) =>
                  setNewAccount({ ...newAccount, sex: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth (Optional)</Label>
              <Input
                id="dob"
                type="date"
                value={newAccount.dob}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, dob: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="roleId">Role</Label>
              <Select
                value={newAccount.roleId}
                onValueChange={(value) =>
                  setNewAccount({ ...newAccount, roleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({role.roleType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAccount}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>Update account information</DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={selectedAccount.name}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedAccount.email}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone (Optional)</Label>
                <Input
                  id="edit-phone"
                  value={selectedAccount.phone}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="edit-sex">Gender (Optional)</Label>
                <Select
                  value={selectedAccount.sex}
                  onValueChange={(value) =>
                    setSelectedAccount({ ...selectedAccount, sex: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-dob">Date of Birth (Optional)</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={selectedAccount.dob}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      dob: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-roleId">Role</Label>
                <Select
                  value={selectedAccount.roleId}
                  onValueChange={(value) =>
                    setSelectedAccount({ ...selectedAccount, roleId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} ({role.roleType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-isVerified">Verification Status</Label>
                <Select
                  value={selectedAccount.isVerified ? "verified" : "unverified"}
                  onValueChange={(value) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      isVerified: value === "verified",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified (Active)</SelectItem>
                    <SelectItem value="unverified">
                      Unverified (Inactive)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount}>Update Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Modal */}
      <WarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirm={warningAction}
        title="Confirm Account Action"
        description="This action will modify account data. Please confirm you want to proceed."
      />
    </div>
  );
}
