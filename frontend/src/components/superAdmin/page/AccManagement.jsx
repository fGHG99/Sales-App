import React, { useState } from 'react';
import { Search, Edit2, Trash2, UserCheck, UserX, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { mockAccounts } from '../mock/MockData';
import ConfirmationModal from '../modal/WarningConfirmation';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });
  const [formData, setFormData] = useState({});

  const accountTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'user', label: 'Users' },
    { value: 'admin', label: 'Admins' },
    { value: 'courier', label: 'Couriers' }
  ];

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || account.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleEditAccount = (account) => {
    if (account.type === 'user') {
      return; // Users cannot be edited
    }
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      email: account.email,
      phone: account.phone,
      deliveryArea: account.deliveryArea || '',
      storeId: account.storeId || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAccount = () => {
    setConfirmationModal({
      isOpen: true,
      action: 'update',
      data: { ...selectedAccount, ...formData },
      title: 'Confirm Account Update',
      message: 'Are you sure you want to override this account data? This may cause problems in the future if credentials are incorrect.'
    });
  };

  const handleDeleteAccount = (account) => {
    setConfirmationModal({
      isOpen: true,
      action: 'delete',
      data: account,
      title: 'Confirm Account Deletion',
      message: `Are you sure you want to delete ${account.name}'s account? This action cannot be undone and may affect system operations.`
    });
  };

  const handleToggleStatus = (account) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    setConfirmationModal({
      isOpen: true,
      action: 'toggle_status',
      data: { ...account, status: newStatus },
      title: 'Confirm Status Change',
      message: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${account.name}'s account?`
    });
  };

  const executeConfirmedAction = () => {
    const { action, data } = confirmationModal;
    
    switch (action) {
      case 'update':
        setAccounts(accounts.map(account => 
          account.id === selectedAccount.id ? data : account
        ));
        setIsEditModalOpen(false);
        setSelectedAccount(null);
        break;
        
      case 'delete':
        setAccounts(accounts.filter(account => account.id !== data.id));
        break;
        
      case 'toggle_status':
        setAccounts(accounts.map(account =>
          account.id === data.id ? data : account
        ));
        break;
    }
    
    setConfirmationModal({ isOpen: false, action: null, data: null });
  };

  const getAccountTypeBadge = (type) => {
    const variants = {
      user: 'default',
      admin: 'success',
      courier: 'secondary'
    };
    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Account Management</h3>
        <p className="text-gray-600">Manage user, admin, and courier accounts</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="filter">Account Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Accounts ({filteredAccounts.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{getAccountTypeBadge(account.type)}</TableCell>
                    <TableCell>
                      <Badge variant={account.status === 'active' ? 'success' : 'secondary'}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(account.registeredDate)}</TableCell>
                    <TableCell>{formatDate(account.lastLogin)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {account.type !== 'user' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(account)}
                        >
                          {account.status === 'active' ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAccount(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Account Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            {selectedAccount?.type === 'courier' && (
              <div>
                <Label htmlFor="edit-deliveryArea">Delivery Area</Label>
                <Input
                  id="edit-deliveryArea"
                  value={formData.deliveryArea || ''}
                  onChange={(e) => setFormData({...formData, deliveryArea: e.target.value})}
                />
              </div>
            )}
            {selectedAccount?.type === 'admin' && (
              <div>
                <Label htmlFor="edit-storeId">Store ID</Label>
                <Input
                  id="edit-storeId"
                  value={formData.storeId || ''}
                  onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateAccount} className="flex-1">
                Update Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

export default AccountManagement;