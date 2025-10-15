import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  MapPin,
  Clock,
  User,
  Package,
  Filter,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  getAllStores,
  createStore,
  updateStore,
  toggleStoreStatus,
  deleteStore,
  getAdminUsers,
} from "../../../services/storeManagementService";
import ConfirmationModal from "../modal/WarningConfirmation";
import Pagination from "../../Pagination";

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSearchOpen, setAdminSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    action: null,
    data: null,
  });
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    openHour: "",
    closeHour: "",
    adminId: "none",
    address: {
      fullAddress: "",
      city: "",
      province: "DKI Jakarta",
      country: "Indonesia",
      postalCode: "",
      latitude: 0,
      longitude: 0,
    },
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [storesPerPage] = useState(6);

  useEffect(() => {
    fetchStores();
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await getAdminUsers();
      setAdminUsers(response.users || []);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllStores();
      setStores(response.stores || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      setError("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      openHour: "",
      closeHour: "",
      adminId: "none",
      address: {
        fullAddress: "",
        city: "",
        province: "DKI Jakarta",
        country: "Indonesia",
        postalCode: "",
        latitude: 0,
        longitude: 0,
      },
    });
  };

  const handleAddStore = () => {
    setConfirmationModal({
      isOpen: true,
      action: "add",
      data: formData,
      title: "Confirm Store Addition",
      message:
        "Are you sure you want to add this new store? This will create a new store entry in the system.",
    });
  };

  const handleEditStore = (store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name || "",
      phoneNumber: store.phoneNumber || "",
      openHour: convertUTCToWIB(store.openHour),
      closeHour: convertUTCToWIB(store.closeHour),
      adminId: store.adminId || "none",
      address: {
        fullAddress: store.address?.fullAddress || "",
        city: store.address?.city || "",
        province: store.address?.province || "DKI Jakarta",
        country: store.address?.country || "Indonesia",
        postalCode: store.address?.postalCode || "",
        latitude: store.address?.latitude || 0,
        longitude: store.address?.longitude || 0,
      },
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStore = () => {
    setConfirmationModal({
      isOpen: true,
      action: "update",
      data: { ...selectedStore, ...formData },
      title: "Confirm Store Update",
      message:
        "Are you sure you want to update this store data? This may cause problems in the future if not properly configured.",
    });
  };

  const handleToggleStatus = (store) => {
    const newStatus = !store.isActive;
    setConfirmationModal({
      isOpen: true,
      action: "toggle_status",
      data: { ...store, isActive: newStatus },
      title: "Confirm Status Change",
      message: `Are you sure you want to ${
        newStatus ? "activate" : "deactivate"
      } this store? This will affect customer access and operations.`,
    });
  };

  const executeConfirmedAction = async () => {
    const { action, data } = confirmationModal;

    try {
      switch (action) {
        case "add":
          // Prepare store data for API
          const storeData = {
            name: data.name,
            phoneNumber: data.phoneNumber || null,
            openHour: convertWIBToUTC(data.openHour),
            closeHour: convertWIBToUTC(data.closeHour),
            adminId: data.adminId === "none" ? null : data.adminId,
            address: data.address,
          };

          const newStoreResponse = await createStore(storeData);
          setStores([...stores, newStoreResponse.store]);
          setIsAddModalOpen(false);
          resetForm();
          break;

        case "update":
          const updateData = {
            name: data.name,
            phoneNumber: data.phoneNumber || null,
            openHour: convertWIBToUTC(data.openHour),
            closeHour: convertWIBToUTC(data.closeHour),
            adminId: data.adminId === "none" ? null : data.adminId,
          };

          const updatedStoreResponse = await updateStore(
            selectedStore.id,
            updateData
          );
          setStores(
            stores.map((store) =>
              store.id === selectedStore.id ? updatedStoreResponse.store : store
            )
          );
          setIsEditModalOpen(false);
          resetForm();
          setSelectedStore(null);
          break;

        case "toggle_status":
          const toggleResponse = await toggleStoreStatus(
            data.id,
            data.isActive
          );
          setStores(
            stores.map((store) =>
              store.id === data.id ? toggleResponse.store : store
            )
          );
          break;

        case "delete":
          await deleteStore(data.id);
          setStores(stores.filter((store) => store.id !== data.id));
          break;
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      setError(`Failed to ${action} store`);
    }

    setConfirmationModal({ isOpen: false, action: null, data: null });
  };

  const handleDeleteStore = (store) => {
    setConfirmationModal({
      isOpen: true,
      action: "delete",
      data: store,
      title: "Confirm Store Deletion",
      message: `Are you sure you want to delete "${store.name}"? This action cannot be undone and will affect all related data.`,
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(stores.length / storesPerPage);
  const startIndex = (currentPage - 1) * storesPerPage;
  const endIndex = startIndex + storesPerPage;
  const currentStores = stores.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const convertWIBToUTC = (wibTimeString) => {
    if (!wibTimeString) return null;

    // Parse waktu WIB (format HH:MM)
    const [hours, minutes] = wibTimeString.split(":").map(Number);

    // Buat date object dengan waktu WIB
    const wibDate = new Date();
    wibDate.setHours(hours, minutes, 0, 0);

    // Konversi ke UTC dengan mengurangi 7 jam (WIB = UTC + 7)
    const utcDate = new Date(wibDate.getTime() - 7 * 60 * 60 * 1000);

    return utcDate.toISOString();
  };

  const convertUTCToWIB = (utcTimeString) => {
    if (!utcTimeString) return "";

    // Parse UTC time dan konversi ke WIB untuk input form
    const utcDate = new Date(utcTimeString);

    // Konversi ke WIB dengan menambah 7 jam
    const wibDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);

    // Format ke HH:MM untuk input form
    const hours = wibDate.getHours().toString().padStart(2, "0");
    const minutes = wibDate.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold">Store Management</h3>
          <p className="text-gray-600">
            Manage and monitor all store locations
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Store
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stores...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchStores}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Store Table */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Store Management
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {startIndex + 1}-{Math.min(endIndex, stores.length)}{" "}
                  of {stores.length} stores
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Store
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Address
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Operating Hours
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Admin
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentStores.map((store) => (
                    <tr
                      key={store.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {store.name}
                            </h4>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {store.address?.fullAddress || "No address"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {convertUTCToWIB(store.openHour)} -{" "}
                            {convertUTCToWIB(store.closeHour)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {store.admin?.name || "No admin"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge
                          variant={store.isActive ? "success" : "secondary"}
                        >
                          {store.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStore(store)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={store.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleStatus(store)}
                          >
                            {store.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStore(store)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Store Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Jakarta Central Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Store phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullAddress">Full Address</Label>
              <Input
                id="fullAddress"
                value={formData.address.fullAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      fullAddress: e.target.value,
                    },
                  })
                }
                placeholder="Full store address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  placeholder="Postal code"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="openHour">Open Hour</Label>
                <Input
                  id="openHour"
                  type="time"
                  value={formData.openHour}
                  onChange={(e) =>
                    setFormData({ ...formData, openHour: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeHour">Close Hour</Label>
                <Input
                  id="closeHour"
                  type="time"
                  value={formData.closeHour}
                  onChange={(e) =>
                    setFormData({ ...formData, closeHour: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminId">Admin</Label>
              <Popover open={adminSearchOpen} onOpenChange={setAdminSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={adminSearchOpen}
                    className="w-full justify-between"
                  >
                    {formData.adminId === "none" || !formData.adminId
                      ? "Select admin (optional)"
                      : adminUsers.find(
                          (admin) => admin.id === formData.adminId
                        )?.name}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search admin..." />
                    <CommandList>
                      <CommandEmpty>No admin found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setFormData({ ...formData, adminId: "none" });
                            setAdminSearchOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.adminId === "none"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          No Admin
                        </CommandItem>
                        {adminUsers.map((admin) => (
                          <CommandItem
                            key={admin.id}
                            value={admin.name}
                            onSelect={() => {
                              setFormData({ ...formData, adminId: admin.id });
                              setAdminSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.adminId === admin.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {admin.name} ({admin.email})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1"
              >
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
            <div className="space-y-2">
              <Label htmlFor="edit-name">Store Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phoneNumber">Phone Number</Label>
              <Input
                id="edit-phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullAddress">Full Address</Label>
              <Input
                id="edit-fullAddress"
                value={formData.address.fullAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      fullAddress: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">Postal Code</Label>
                <Input
                  id="edit-postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        postalCode: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-openHour">Open Hour</Label>
                <Input
                  id="edit-openHour"
                  type="time"
                  value={formData.openHour}
                  onChange={(e) =>
                    setFormData({ ...formData, openHour: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-closeHour">Close Hour</Label>
                <Input
                  id="edit-closeHour"
                  type="time"
                  value={formData.closeHour}
                  onChange={(e) =>
                    setFormData({ ...formData, closeHour: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-adminId">Admin</Label>
              <Popover open={adminSearchOpen} onOpenChange={setAdminSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={adminSearchOpen}
                    className="w-full justify-between"
                  >
                    {formData.adminId === "none" || !formData.adminId
                      ? "Select admin (optional)"
                      : adminUsers.find(
                          (admin) => admin.id === formData.adminId
                        )?.name}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search admin..." />
                    <CommandList>
                      <CommandEmpty>No admin found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setFormData({ ...formData, adminId: "none" });
                            setAdminSearchOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.adminId === "none"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          No Admin
                        </CommandItem>
                        {adminUsers.map((admin) => (
                          <CommandItem
                            key={admin.id}
                            value={admin.name}
                            onSelect={() => {
                              setFormData({ ...formData, adminId: admin.id });
                              setAdminSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.adminId === admin.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {admin.name} ({admin.email})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1"
              >
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
        onClose={() =>
          setConfirmationModal({ isOpen: false, action: null, data: null })
        }
        onConfirm={executeConfirmedAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
    </div>
  );
};

export default StoreManagement;
