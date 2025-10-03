import React, { useState, useEffect } from 'react';
import { Plus, Edit2, MapPin, Clock, User, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { mockAPI } from '../mock/MockData';
import ConfirmationModal from '../modal/WarningConfirmation';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    openHour: '',
    closeHour: '',
    adminName: '',
    adminId: ''
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await mockAPI.storeAPI.getAll();
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      address: '',
      openHour: '',
      closeHour: '',
      adminName: '',
      adminId: ''
    });
  };

  const handleAddStore = () => {
    setConfirmationModal({
      isOpen: true,
      action: 'add',
      data: formData,
      title: 'Confirm Store Addition',
      message: 'Are you sure you want to add this new store? This will create a new store entry in the system.'
    });
  };

  const handleEditStore = (store) => {
    setSelectedStore(store);
    setFormData({
      label: store.label,
      address: store.address,
      openHour: store.openHour,
      closeHour: store.closeHour,
      adminName: store.adminName,
      adminId: store.adminId
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStore = () => {
    setConfirmationModal({
      isOpen: true,
      action: 'update',
      data: { ...selectedStore, ...formData },
      title: 'Confirm Store Update',
      message: 'Are you sure you want to update this store data? This may cause problems in the future if not properly configured.'
    });
  };

  const handleToggleStatus = (store) => {
    const newStatus = store.status === 'active' ? 'inactive' : 'active';
    setConfirmationModal({
      isOpen: true,
      action: 'toggle_status',
      data: { ...store, status: newStatus },
      title: 'Confirm Status Change',
      message: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this store? This will affect customer access and operations.`
    });
  };

  const executeConfirmedAction = () => {
    const { action, data } = confirmationModal;
    
    switch (action) {
      case 'add':
        const newStore = {
          id: `store_${Date.now()}`,
          ...data,
          status: 'active',
          productCount: 0,
          dailySales: 0
        };
        setStores([...stores, newStore]);
        setIsAddModalOpen(false);
        resetForm();
        break;
        
      case 'update':
        setStores(stores.map(store => 
          store.id === selectedStore.id ? data : store
        ));
        setIsEditModalOpen(false);
        resetForm();
        setSelectedStore(null);
        break;
        
      case 'toggle_status':
        setStores(stores.map(store =>
          store.id === data.id ? data : store
        ));
        break;
    }
    
    setConfirmationModal({ isOpen: false, action: null, data: null });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold">Store Management</h3>
          <p className="text-gray-600">Manage and monitor all store locations</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add New Store
        </Button>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <Card key={store.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{store.label}</CardTitle>
                <Badge variant={store.status === 'active' ? 'success' : 'secondary'}>
                  {store.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{store.address}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{store.openHour} - {store.closeHour}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{store.adminName}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>{store.productCount} products</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-1">Daily Sales</p>
                <p className="font-bold text-lg">{formatCurrency(store.dailySales)}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditStore(store)}
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={store.status === 'active' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => handleToggleStatus(store)}
                  className="flex-1"
                >
                  {store.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Store Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Store Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                placeholder="e.g., Jakarta Central Store"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full store address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="openHour">Open Hour</Label>
                <Input
                  id="openHour"
                  type="time"
                  value={formData.openHour}
                  onChange={(e) => setFormData({...formData, openHour: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="closeHour">Close Hour</Label>
                <Input
                  id="closeHour"
                  type="time"
                  value={formData.closeHour}
                  onChange={(e) => setFormData({...formData, closeHour: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="adminName">Admin Name</Label>
              <Input
                id="adminName"
                value={formData.adminName}
                onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                placeholder="Store admin name"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddStore} className="flex-1">
                Add Store
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Store Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-label">Store Label</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-openHour">Open Hour</Label>
                <Input
                  id="edit-openHour"
                  type="time"
                  value={formData.openHour}
                  onChange={(e) => setFormData({...formData, openHour: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-closeHour">Close Hour</Label>
                <Input
                  id="edit-closeHour"
                  type="time"
                  value={formData.closeHour}
                  onChange={(e) => setFormData({...formData, closeHour: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-adminName">Admin Name</Label>
              <Input
                id="edit-adminName"
                value={formData.adminName}
                onChange={(e) => setFormData({...formData, adminName: e.target.value})}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateStore} className="flex-1">
                Update Store
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

export default StoreManagement;