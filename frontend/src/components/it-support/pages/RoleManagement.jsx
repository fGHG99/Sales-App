import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/hook/useToast";
import useDebounce from "@/components/hook/useDebounce";
import {
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Key,
  Search,
  X,
} from "lucide-react";
import WarningModal from "../modal/WarningModal";
import RoleManagementSkeleton from "@/components/skeleton/RoleManagementSkeleton";
import Pagination from "@/components/Pagination";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  createPermission,
  deletePermission,
  searchPermissions,
} from "@/services/supportService";

export default function RoleManagement() {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [accessKeys, setAccessKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isCreateAccessKeyModalOpen, setIsCreateAccessKeyModalOpen] =
    useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [warningAction, setWarningAction] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [newRole, setNewRole] = useState({
    name: "",
    roleType: "",
    permissionIds: [],
  });
  const [newAccessKey, setNewAccessKey] = useState({
    accessKey: "",
    roleIds: [],
  });

  // Pagination state for access keys per expanded role (client-side pagination)
  const [roleAccessKeysPage, setRoleAccessKeysPage] = useState({});

  // Search state for access keys per role
  const [accessKeySearchQuery, setAccessKeySearchQuery] = useState({});
  const [searchedAccessKeys, setSearchedAccessKeys] = useState({});
  const [isSearchingAccessKeys, setIsSearchingAccessKeys] = useState({});

  // Use debounce hook for search query object (debounce entire state)
  const debouncedSearchQuery = useDebounce(accessKeySearchQuery, 500);

  // Fetch data on mount
  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    Object.entries(debouncedSearchQuery).forEach(([roleId, query]) => {
      if (query && query.trim().length >= 2) {
        performAccessKeySearch(roleId, query);
      } else if (!query || query.trim().length === 0) {
        // Clear search for this role
        setSearchedAccessKeys((prev) => {
          const updated = { ...prev };
          delete updated[roleId];
          return updated;
        });
        setIsSearchingAccessKeys((prev) => {
          const updated = { ...prev };
          delete updated[roleId];
          return updated;
        });
      }
    });
  }, [debouncedSearchQuery]);

  const fetchRolesAndPermissions = async () => {
    try {
      setIsLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        getRoles(),
        getPermissions(1, 1000), // Fetch all permissions with high limit for client-side pagination
      ]);

      if (rolesResponse.success) {
        setRoles(rolesResponse.roles);
      }
      if (permissionsResponse.success) {
        setAccessKeys(permissionsResponse.permissions);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.error || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Perform access key search for a specific role
  const performAccessKeySearch = async (roleId, query) => {
    try {
      setIsSearchingAccessKeys((prev) => ({ ...prev, [roleId]: true }));

      const response = await searchPermissions(query, 1, 1000); // Get all matching results

      if (response.success) {
        setSearchedAccessKeys((prev) => ({
          ...prev,
          [roleId]: response.permissions,
        }));
        // Reset to first page when new search
        setRoleAccessKeysPage((prev) => ({ ...prev, [roleId]: 1 }));
      }
    } catch (error) {
      console.error("Error searching access keys:", error);
      toast({
        title: "Search failed",
        description: "Failed to search access keys",
        variant: "destructive",
      });
    } finally {
      setIsSearchingAccessKeys((prev) => ({ ...prev, [roleId]: false }));
    }
  };

  // Helper function for client-side pagination of access keys per role
  const getPaginatedAccessKeys = (roleId) => {
    const page = roleAccessKeysPage[roleId] || 1;
    const limit = 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    // Use searched results if available, otherwise use all access keys
    const sourceKeys = searchedAccessKeys[roleId] || accessKeys;

    return {
      items: sourceKeys.slice(start, end),
      currentPage: page,
      totalPages: Math.ceil(sourceKeys.length / limit),
      isSearching: isSearchingAccessKeys[roleId] || false,
      hasSearchQuery: !!accessKeySearchQuery[roleId],
      totalResults: sourceKeys.length,
    };
  };

  // Handle page change for access keys in expanded role
  const handleAccessKeysPageChange = (roleId, page) => {
    setRoleAccessKeysPage((prev) => ({
      ...prev,
      [roleId]: page,
    }));
  };

  // Handle access key search input change
  const handleAccessKeySearchChange = (roleId, value) => {
    setAccessKeySearchQuery((prev) => ({
      ...prev,
      [roleId]: value,
    }));
  };

  // Clear access key search for a specific role
  const handleClearAccessKeySearch = (roleId) => {
    setAccessKeySearchQuery((prev) => {
      const updated = { ...prev };
      delete updated[roleId];
      return updated;
    });
    setSearchedAccessKeys((prev) => {
      const updated = { ...prev };
      delete updated[roleId];
      return updated;
    });
    setRoleAccessKeysPage((prev) => ({ ...prev, [roleId]: 1 }));
  };

  const toggleRoleExpansion = (roleId) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const handleAccessKeyChange = (roleId, permissionId, checked) => {
    setWarningAction(() => async () => {
      try {
        const role = roles.find((r) => r.id === roleId);
        const currentPermissionIds = role.permissions.map((p) => p.id);
        const updatedPermissionIds = checked
          ? [...currentPermissionIds, permissionId]
          : currentPermissionIds.filter((id) => id !== permissionId);

        const response = await updateRole(roleId, {
          name: role.name,
          roleType: role.roleType,
          permissionIds: updatedPermissionIds,
        });

        if (response.success) {
          toast({
            title: "Access key updated",
            description: "Role permissions have been modified.",
          });
          fetchRolesAndPermissions(); // Refresh data
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to update permissions",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  const handleCreateRole = () => {
    setWarningAction(() => async () => {
      try {
        const response = await createRole(newRole);
        if (response.success) {
          setNewRole({ name: "", roleType: "", permissionIds: [] });
          setIsCreateRoleModalOpen(false);
          toast({
            title: "Role created successfully",
            description: `${response.role.name} role has been added.`,
          });
          fetchRolesAndPermissions(); // Refresh data
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to create role",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  const handleCreateAccessKey = () => {
    setWarningAction(() => async () => {
      try {
        const response = await createPermission(newAccessKey);
        if (response.success) {
          setNewAccessKey({ accessKey: "", roleIds: [] });
          setIsCreateAccessKeyModalOpen(false);
          toast({
            title: "Access key created successfully",
            description: `${response.permission.accessKey} access key has been added.`,
          });

          // Reset pagination for all expanded roles since access keys changed
          setRoleAccessKeysPage({});

          // Refresh all data
          fetchRolesAndPermissions();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to create access key",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole({
      id: role.id,
      name: role.name,
      roleType: role.roleType,
      permissionIds: role.permissions.map((p) => p.id),
      isSystem: role.isSystem,
    });
    setIsEditRoleModalOpen(true);
  };

  const handleUpdateRole = () => {
    setWarningAction(() => async () => {
      try {
        const response = await updateRole(selectedRole.id, {
          name: selectedRole.name,
          roleType: selectedRole.roleType,
          permissionIds: selectedRole.permissionIds,
        });
        if (response.success) {
          setIsEditRoleModalOpen(false);
          toast({
            title: "Role updated successfully",
            description: `${response.role.name} has been updated.`,
          });
          fetchRolesAndPermissions(); // Refresh data
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to update role",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  const handleDeleteRole = (role) => {
    setWarningAction(() => async () => {
      try {
        const response = await deleteRole(role.id);
        if (response.success) {
          toast({
            title: "Role deleted successfully",
            description: `${role.name} role has been removed.`,
          });
          fetchRolesAndPermissions(); // Refresh data
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to delete role",
          variant: "destructive",
        });
      }
    });
    setIsWarningModalOpen(true);
  };

  const handleDeleteAccessKey = (accessKey) => {
    setWarningAction(() => async () => {
      try {
        const response = await deletePermission(accessKey.id);
        if (response.success) {
          const affectedRolesMsg = response.affectedRoles
            ? ` (disconnected from ${response.affectedRoles} role${
                response.affectedRoles !== 1 ? "s" : ""
              })`
            : "";

          toast({
            title: "Access key deleted successfully",
            description: `${accessKey.accessKey} has been removed${affectedRolesMsg}.`,
          });

          // Reset pagination for all expanded roles since access keys changed
          setRoleAccessKeysPage({});

          // Refresh all data (roles and access keys)
          fetchRolesAndPermissions();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to delete access key",
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
          <h2 className="text-2xl font-bold text-slate-800">Role Management</h2>
          <p className="text-slate-600">Manage roles and access permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateAccessKeyModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Create Access Key
          </Button>
          <Button
            onClick={() => setIsCreateRoleModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </div>
      </div>

      {isLoading ? (
        <RoleManagementSkeleton count={5} />
      ) : (
        <div className="grid gap-6">
          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Manage roles and their associated access keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Access Keys</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <React.Fragment key={role.id}>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRoleExpansion(role.id)}
                              className="p-1 h-6 w-6"
                            >
                              {expandedRoles[role.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <span>{role.name}</span>
                            {role.isSystem && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                              >
                                System
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {role.permissions?.length || 0} keys
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(role.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                              disabled={role.isSystem}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRole(role)}
                              className="text-red-600 hover:text-red-700"
                              disabled={role.isSystem}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRoles[role.id] && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-slate-50">
                            <div className="p-4 space-y-4">
                              {/* Header with Search */}
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-slate-700">
                                  Access Keys:
                                </h4>
                                <div className="relative w-64">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <Input
                                    type="text"
                                    placeholder="Search access keys..."
                                    value={accessKeySearchQuery[role.id] || ""}
                                    onChange={(e) =>
                                      handleAccessKeySearchChange(
                                        role.id,
                                        e.target.value
                                      )
                                    }
                                    className="pl-8 pr-8 h-8 text-sm"
                                  />
                                  {accessKeySearchQuery[role.id] && (
                                    <button
                                      onClick={() =>
                                        handleClearAccessKeySearch(role.id)
                                      }
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      type="button"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Search Info */}
                              {getPaginatedAccessKeys(role.id)
                                .hasSearchQuery && (
                                <div className="text-xs text-slate-600 mb-2">
                                  {getPaginatedAccessKeys(role.id)
                                    .isSearching ? (
                                    <span>Searching...</span>
                                  ) : (
                                    <span>
                                      Found{" "}
                                      {
                                        getPaginatedAccessKeys(role.id)
                                          .totalResults
                                      }{" "}
                                      result(s) for "
                                      {accessKeySearchQuery[role.id]}"
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Access Keys Grid */}
                              <div className="grid grid-cols-2 gap-2">
                                {getPaginatedAccessKeys(role.id).items.map(
                                  (accessKey) => {
                                    const hasPermission =
                                      role.permissions?.some(
                                        (p) => p.id === accessKey.id
                                      );
                                    return (
                                      <div
                                        key={accessKey.id}
                                        className="flex items-center space-x-2 p-2 bg-white rounded border"
                                      >
                                        <Checkbox
                                          id={`${role.id}-${accessKey.id}`}
                                          checked={hasPermission}
                                          onCheckedChange={(checked) =>
                                            handleAccessKeyChange(
                                              role.id,
                                              accessKey.id,
                                              checked
                                            )
                                          }
                                          disabled={role.isSystem}
                                        />
                                        <div className="flex-1">
                                          <Label
                                            htmlFor={`${role.id}-${accessKey.id}`}
                                            className={`text-sm font-medium ${
                                              !role.isSystem
                                                ? "cursor-pointer"
                                                : "cursor-not-allowed opacity-60"
                                            }`}
                                          >
                                            {accessKey.accessKey}
                                          </Label>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteAccessKey(accessKey)
                                          }
                                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    );
                                  }
                                )}
                              </div>

                              {/* Empty State */}
                              {getPaginatedAccessKeys(role.id).items.length ===
                                0 && (
                                <div className="text-center py-8 text-slate-500">
                                  {getPaginatedAccessKeys(role.id)
                                    .hasSearchQuery ? (
                                    <p className="text-sm">
                                      No access keys found for "
                                      {accessKeySearchQuery[role.id]}"
                                    </p>
                                  ) : (
                                    <p className="text-sm">
                                      No access keys available
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Pagination for access keys */}
                              {getPaginatedAccessKeys(role.id).totalPages >
                                1 && (
                                <div className="mt-4 flex justify-center">
                                  <Pagination
                                    currentPage={
                                      getPaginatedAccessKeys(role.id)
                                        .currentPage
                                    }
                                    totalPages={
                                      getPaginatedAccessKeys(role.id).totalPages
                                    }
                                    onPageChange={(page) =>
                                      handleAccessKeysPageChange(role.id, page)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Access Keys Table */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Access Keys</CardTitle>
              <CardDescription>
                Manage available access keys in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key Name</TableHead>
                    <TableHead>Used By Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessKeys.length > 0 ? (
                    accessKeys.map((accessKey) => (
                      <TableRow key={accessKey.id}>
                        <TableCell className="font-medium">
                          {accessKey.accessKey}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {accessKey.role?.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {accessKey.role.map((r) => (
                                <Badge
                                  key={r.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {r.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">
                              Not assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAccessKey(accessKey)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <p className="text-slate-500">No access keys found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
          {/* {accessKeysTotalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={accessKeysPage}
                    totalPages={accessKeysTotalPages}
                    onPageChange={setAccessKeysPage}
                  />
                </div>
              )}
            </CardContent>
          </Card> */}
        </div>
      )}

      {/* Create Role Modal */}
      <Dialog
        open={isCreateRoleModalOpen}
        onOpenChange={setIsCreateRoleModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Add a new role to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole({ ...newRole, name: e.target.value })
                }
                placeholder="Enter role name (e.g., Manager)"
              />
            </div>
            <div>
              <Label htmlFor="role-type">Role Type</Label>
              <Input
                id="role-type"
                value={newRole.roleType}
                onChange={(e) =>
                  setNewRole({ ...newRole, roleType: e.target.value })
                }
                placeholder="Enter role type (e.g., manager)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Role type is used for programmatic access. Use lowercase without
                spaces.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Access Key Modal */}
      <Dialog
        open={isCreateAccessKeyModalOpen}
        onOpenChange={setIsCreateAccessKeyModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Access Key</DialogTitle>
            <DialogDescription>
              Add a new access key to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="access-key-name">Access Key</Label>
              <Input
                id="access-key-name"
                value={newAccessKey.accessKey}
                onChange={(e) =>
                  setNewAccessKey({
                    ...newAccessKey,
                    accessKey: e.target.value,
                  })
                }
                placeholder="e.g., support.user.create"
              />
              <p className="text-xs text-slate-500 mt-1">
                Use dot notation for hierarchical permissions (e.g.,
                module.resource.action)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateAccessKeyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAccessKey}>Create Access Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditRoleModalOpen} onOpenChange={setIsEditRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              {selectedRole.isSystem && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This is a system role. Modifications are restricted.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input
                  id="edit-role-name"
                  value={selectedRole.name}
                  onChange={(e) =>
                    setSelectedRole({ ...selectedRole, name: e.target.value })
                  }
                  disabled={selectedRole.isSystem}
                />
              </div>
              <div>
                <Label htmlFor="edit-role-type">Role Type</Label>
                <Input
                  id="edit-role-type"
                  value={selectedRole.roleType}
                  onChange={(e) =>
                    setSelectedRole({
                      ...selectedRole,
                      roleType: e.target.value,
                    })
                  }
                  disabled={selectedRole.isSystem}
                  placeholder="e.g., manager"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={selectedRole?.isSystem}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Modal */}
      <WarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirm={warningAction}
        title="Confirm Role Action"
        description="This action will modify role permissions. Please confirm you want to proceed."
      />
    </div>
  );
}
