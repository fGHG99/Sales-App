import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/hook/useToast';
import { Edit, Trash2, Plus, ChevronDown, ChevronRight, Key } from 'lucide-react';
import { mockData } from '../data/mockData';
import WarningModal from '../modal/WarningModal';

export default function RoleManagement() {
  const { toast } = useToast();
  const [roles, setRoles] = useState(mockData.roles);
  const [accessKeys, setAccessKeys] = useState(mockData.accessKeys);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isCreateAccessKeyModalOpen, setIsCreateAccessKeyModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [warningAction, setWarningAction] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [newRole, setNewRole] = useState({ name: '', accessKeys: [] });
  const [newAccessKey, setNewAccessKey] = useState({ name: '', description: '' });

  const toggleRoleExpansion = (roleId) => {
    setExpandedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  const handleAccessKeyChange = (roleId, accessKeyId, checked) => {
    setWarningAction(() => () => {
      setRoles(roles.map(role => {
        if (role.id === roleId) {
          const updatedAccessKeys = checked 
            ? [...role.accessKeys, accessKeyId]
            : role.accessKeys.filter(id => id !== accessKeyId);
          return { ...role, accessKeys: updatedAccessKeys };
        }
        return role;
      }));
      toast({ title: 'Access key updated', description: 'Role permissions have been modified.' });
    });
    setIsWarningModalOpen(true);
  };

  const handleCreateRole = () => {
    const role = {
      id: Date.now(),
      ...newRole,
      createdAt: new Date().toLocaleDateString()
    };
    
    setWarningAction(() => () => {
      setRoles([...roles, role]);
      setNewRole({ name: '', accessKeys: [] });
      setIsCreateRoleModalOpen(false);
      toast({ title: 'Role created successfully', description: `${role.name} role has been added.` });
    });
    setIsWarningModalOpen(true);
  };

  const handleCreateAccessKey = () => {
    const accessKey = {
      id: Date.now(),
      ...newAccessKey,
      createdAt: new Date().toLocaleDateString()
    };
    
    setWarningAction(() => () => {
      setAccessKeys([...accessKeys, accessKey]);
      setNewAccessKey({ name: '', description: '' });
      setIsCreateAccessKeyModalOpen(false);
      toast({ title: 'Access key created successfully', description: `${accessKey.name} access key has been added.` });
    });
    setIsWarningModalOpen(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole({ ...role });
    setIsEditRoleModalOpen(true);
  };

  const handleUpdateRole = () => {
    setWarningAction(() => () => {
      setRoles(roles.map(role => 
        role.id === selectedRole.id ? selectedRole : role
      ));
      setIsEditRoleModalOpen(false);
      toast({ title: 'Role updated successfully', description: `${selectedRole.name} has been updated.` });
    });
    setIsWarningModalOpen(true);
  };

  const handleDeleteRole = (role) => {
    setWarningAction(() => () => {
      setRoles(roles.filter(r => r.id !== role.id));
      toast({ title: 'Role deleted successfully', description: `${role.name} role has been removed.` });
    });
    setIsWarningModalOpen(true);
  };

  const handleDeleteAccessKey = (accessKey) => {
    setWarningAction(() => () => {
      setAccessKeys(accessKeys.filter(ak => ak.id !== accessKey.id));
      // Remove access key from all roles
      setRoles(roles.map(role => ({
        ...role,
        accessKeys: role.accessKeys.filter(id => id !== accessKey.id)
      })));
      toast({ title: 'Access key deleted successfully', description: `${accessKey.name} has been removed from all roles.` });
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
          <Button onClick={() => setIsCreateAccessKeyModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Create Access Key
          </Button>
          <Button onClick={() => setIsCreateRoleModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </div>
      </div>

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
                            {expandedRoles[role.id] ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {role.accessKeys.length} keys
                        </Badge>
                      </TableCell>
                      <TableCell>{role.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRoles[role.id] && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-slate-50">
                          <div className="p-4 space-y-2">
                            <h4 className="font-medium text-slate-700 mb-3">Access Keys:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {accessKeys.map((accessKey) => (
                                <div key={accessKey.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <Checkbox
                                    id={`${role.id}-${accessKey.id}`}
                                    checked={role.accessKeys.includes(accessKey.id)}
                                    onCheckedChange={(checked) => 
                                      handleAccessKeyChange(role.id, accessKey.id, checked)
                                    }
                                  />
                                  <div className="flex-1">
                                    <Label 
                                      htmlFor={`${role.id}-${accessKey.id}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {accessKey.name}
                                    </Label>
                                    <p className="text-xs text-slate-500">{accessKey.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
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
        <Card>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessKeys.map((accessKey) => (
                  <TableRow key={accessKey.id}>
                    <TableCell className="font-medium">{accessKey.name}</TableCell>
                    <TableCell className="text-slate-600">{accessKey.description}</TableCell>
                    <TableCell>{accessKey.createdAt}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Role Modal */}
      <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Add a new role to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                placeholder="Enter role name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Access Key Modal */}
      <Dialog open={isCreateAccessKeyModalOpen} onOpenChange={setIsCreateAccessKeyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Access Key</DialogTitle>
            <DialogDescription>
              Add a new access key to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="access-key-name">Access Key Name</Label>
              <Input
                id="access-key-name"
                value={newAccessKey.name}
                onChange={(e) => setNewAccessKey({...newAccessKey, name: e.target.value})}
                placeholder="Enter access key name"
              />
            </div>
            <div>
              <Label htmlFor="access-key-description">Description</Label>
              <Input
                id="access-key-description"
                value={newAccessKey.description}
                onChange={(e) => setNewAccessKey({...newAccessKey, description: e.target.value})}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateAccessKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccessKey}>
              Create Access Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditRoleModalOpen} onOpenChange={setIsEditRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input
                  id="edit-role-name"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
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
};

