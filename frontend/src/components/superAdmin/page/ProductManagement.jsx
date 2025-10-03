import React, { useState } from 'react';
import { Search, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { mockProducts } from '../mock/MockData';
import ConfirmationModal from '../modal/WarningConfirmation';

const ProductManagement = () => {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });
  const [formData, setFormData] = useState({});

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Makanan Pokok', label: 'Makanan Pokok' },
    { value: 'Minuman', label: 'Minuman' },
    { value: 'Snack', label: 'Snack' },
    { value: 'Kesehatan', label: 'Kesehatan' },
    { value: 'Rumah Tangga', label: 'Rumah Tangga' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      category: product.category,
      isPerishable: product.isPerishable,
      batch: product.batch,
      image: product.image
    });
    setIsEditModalOpen(true);
  };

  const handleToggleActive = (product) => {
    const newStatus = !product.isActive;
    setConfirmationModal({
      isOpen: true,
      action: 'toggle_active',
      data: { ...product, isActive: newStatus },
      title: 'Confirm Product Status Change',
      message: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${product.name}? This will affect product availability for customers.`
    });
  };

  const handleTogglePerishable = (product) => {
    const newPerishableStatus = !product.isPerishable;
    setConfirmationModal({
      isOpen: true,
      action: 'toggle_perishable',
      data: { ...product, isPerishable: newPerishableStatus },
      title: 'Confirm Perishable Status Change',
      message: `Are you sure you want to change the perishable status of ${product.name}? This may affect inventory management and expiry tracking.`
    });
  };

  const handleUpdateProduct = () => {
    setConfirmationModal({
      isOpen: true,
      action: 'update',
      data: { ...selectedProduct, ...formData },
      title: 'Confirm Product Update',
      message: 'Are you sure you want to override this product data? This may cause problems in the future if inventory or pricing is incorrect.'
    });
  };

  const executeConfirmedAction = () => {
    const { action, data } = confirmationModal;
    
    switch (action) {
      case 'update':
        setProducts(products.map(product => 
          product.id === selectedProduct.id ? data : product
        ));
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        break;
        
      case 'toggle_active':
      case 'toggle_perishable':
        setProducts(products.map(product =>
          product.id === data.id ? data : product
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
      <div>
        <h3 className="text-2xl font-bold">Product Management</h3>
        <p className="text-gray-600">Manage product inventory and details</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">ID: {product.id}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={product.isActive ? 'success' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={product.isPerishable ? 'destructive' : 'default'}>
                    {product.isPerishable ? 'Perishable' : 'Non-Perishable'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <p className="font-bold">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Stock:</span>
                    <p className="font-medium">{product.quantity} units</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Batch:</span>
                    <p className="font-medium">{product.batch}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={product.isActive ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => handleToggleActive(product)}
                  className="flex-1"
                >
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Perishable</span>
                <Switch
                  checked={product.isPerishable}
                  onCheckedChange={() => handleTogglePerishable(product)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-price">Selling Price (IDR)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.sellingPrice || ''}
                  onChange={(e) => setFormData({...formData, sellingPrice: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-batch">Batch</Label>
              <Input
                id="edit-batch"
                value={formData.batch || ''}
                onChange={(e) => setFormData({...formData, batch: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={formData.image || ''}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateProduct} className="flex-1">
                Update Product
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

export default ProductManagement;