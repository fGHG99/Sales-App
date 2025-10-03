import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { mockRoles } from '../mock/MockData';
import ConfirmationModal from '../modal/WarningConfirmation';

const RoleManagement = () => {
  const [roles, setRoles] = useState(mockRoles);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });

  const availableAccessKeys = [
    'CREATE_STORE',
    'DELETE_USER', 
    'MODIFY_PRODUCTS',
    'VIEW_REPORTS',
    'SYSTEM_CONFIG',
    'MANAGE_ORDERS',
    'VIEW_PRODUCTS',
    'UPDATE_INVENTORY',
    'VIEW_ORDERS',
    'UPDATE_DELIVERY_STATUS',
    'EXPORT_DATA',
    'AUDIT_LOGS',
    'ROLE_MANAGEMENT',
    'FEE_MANAGEMENT'
  ];

  const toggleRoleExpansion = (roleId) => {
    setExpandedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  const handleAccessKeyChange = (roleId, accessKey, isChecked) => {
    const role = roles.find(r => r.id === roleId);
    const updatedAccessKeys = isChecked 
      ? [...role.accessKeys, accessKey]
      : role.accessKeys.filter(key => key !== accessKey);

    setConfirmationModal({
      isOpen: true,
      action: 'update_access',
      data: { roleId, accessKeys: updatedAccessKeys },
      title: 'Confirm Access Key Change',
      message: `Are you sure you want to ${isChecked ? 'grant' : 'revoke'} the "${accessKey}" permission for ${role.name}? This may affect system security and user capabilities.`
    });
  };

  const executeConfirmedAction = () => {
    const { action, data } = confirmationModal;
    
    if (action === 'update_access') {
      setRoles(roles.map(role => 
        role.id === data.roleId 
          ? { ...role, accessKeys: data.accessKeys }
          : role
      ));
    }
    
    setConfirmationModal({ isOpen: false, action: null, data: null });
  };

  const getRoleBadgeVariant = (type) => {
    const variants = {
      superadmin: 'destructive',
      admin: 'success',
      courier: 'secondary'
    };
    return variants[type] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Role Management</h3>
        <p className="text-gray-600">Manage user roles and access permissions</p>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {role.accessKeys.length} access keys assigned
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getRoleBadgeVariant(role.type)}>
                    {role.type}
                  </Badge>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRoleExpansion(role.id)}
                      >
                        {expandedRoles[role.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="ml-2">Access Keys</span>
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>
              </div>
            </CardHeader>
            
            <Collapsible open={expandedRoles[role.id]}>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Access Keys Configuration
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableAccessKeys.map((accessKey) => {
                        const isChecked = role.accessKeys.includes(accessKey);
                        const isDisabled = role.type === 'superadmin' && role.permissions.includes('all');
                        
                        return (
                          <div
                            key={accessKey}
                            className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
                          >
                            <Checkbox
                              id={`${role.id}-${accessKey}`}
                              checked={isChecked || isDisabled}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => 
                                handleAccessKeyChange(role.id, accessKey, checked)
                              }
                            />
                            <label
                              htmlFor={`${role.id}-${accessKey}`}
                              className={`text-sm font-medium cursor-pointer ${
                                isDisabled ? 'text-gray-400' : ''
                              }`}
                            >
                              {accessKey.replace(/_/g, ' ')}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    
                    {role.type === 'superadmin' && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Note:</strong> Super Admin has all permissions by default. 
                          Individual access keys cannot be modified.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Access Keys Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Access Keys Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAccessKeys.map((accessKey) => {
              const rolesWithAccess = roles.filter(role => 
                role.accessKeys.includes(accessKey) || 
                (role.type === 'superadmin' && role.permissions.includes('all'))
              );
              
              return (
                <div
                  key={accessKey}
                  className="p-3 border rounded-lg"
                >
                  <h4 className="font-medium text-sm mb-2">
                    {accessKey.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Assigned to {rolesWithAccess.length} role(s)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {rolesWithAccess.map((role) => (
                      <Badge
                        key={role.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, action: null, data: null })}
        onConfirm={executeConfirmedAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
    </div>
  );
};

export default RoleManagement;