import React, { useState } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  orders as initialOrders,
  formatCurrency,
  formatDate,
  getStatusColor,
} from "../../../utils/mockDataAdmin";
import Pagination from "../../Pagination";

const OrderManagement = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const statusWorkflow = {
    "menunggu persiapan": "pesanan selesai disiapkan",
    "pesanan selesai disiapkan": "menunggu kurir", // Auto-transition
    "menunggu kurir": "sedang dikirim",
    "sedang dikirim": "selesai",
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          let updatedOrder = { ...order, status: newStatus };

          // Auto-transition logic
          if (newStatus === "pesanan selesai disiapkan") {
            updatedOrder.isPrepared = true;
            // Simulate auto-transition to 'menunggu kurir' after preparation
            setTimeout(() => {
              setOrders((current) =>
                current.map((o) =>
                  o.id === orderId ? { ...o, status: "menunggu kurir" } : o
                )
              );
            }, 2000);
          }

          return updatedOrder;
        }
        return order;
      })
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "pending") return order.status === "menunggu persiapan";
    if (filter === "ready") return order.status === "pesanan selesai disiapkan";
    if (filter === "shipping") return order.status === "sedang dikirim";
    if (filter === "disputed") return order.isDisputed;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getActionButton = (order) => {
    const nextStatus = statusWorkflow[order.status];
    if (!nextStatus) return null;

    const buttonConfig = {
      "menunggu persiapan": {
        text: "Mark as Prepared",
        icon: CheckCircle,
        variant: "default",
        testId: `mark-prepared-${order.id}`,
      },
      "menunggu kurir": {
        text: "Courier Picked Up",
        icon: Package,
        variant: "outline",
        testId: `courier-pickup-${order.id}`,
      },
      "sedang dikirim": {
        text: "Mark Delivered",
        icon: CheckCircle,
        variant: "default",
        testId: `mark-delivered-${order.id}`,
      },
    };

    const config = buttonConfig[order.status];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Button
        variant={config.variant}
        size="sm"
        onClick={() => updateOrderStatus(order.id, nextStatus)}
        className="ml-2"
        data-testid={config.testId}
      >
        <Icon className="w-4 h-4 mr-2" />
        {config.text}
      </Button>
    );
  };

  const OrderDetailsModal = ({ order, onClose }) => (
    <DialogContent className="max-w-2xl" data-testid="order-details-modal">
      <DialogHeader>
        <DialogTitle>Order Details - {order.id}</DialogTitle>
        <DialogDescription>
          Complete information about this order
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Order Items */}
        <div>
          <h3 className="font-semibold mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(item.price)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between font-bold">
              <span>Total Amount:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Ordered: {formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Delivery Information</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                <span className="text-sm">{order.deliveryAddress}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  ETA: {formatDate(order.estimatedDelivery)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Courier Information */}
        {order.courierId && (
          <div>
            <h3 className="font-semibold mb-3">Assigned Courier</h3>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p>
                <span className="font-medium">Courier ID:</span>{" "}
                {order.courierId}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Note: For privacy, courier details are available in the courier
                tracking section
              </p>
            </div>
          </div>
        )}

        {/* Status & Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <Badge
              className={getStatusColor(order.status)}
              data-testid={`order-status-${order.id}`}
            >
              {order.status}
            </Badge>
            {order.isDisputed && (
              <Badge
                variant="destructive"
                className="ml-2"
                data-testid="dispute-indicator"
              >
                Disputed
              </Badge>
            )}
          </div>
          {getActionButton(order)}
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-6" data-testid="order-management">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">
          Manage order preparation and fulfillment workflow
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "All Orders" },
          { key: "pending", label: "Need Preparation" },
          { key: "ready", label: "Ready for Pickup" },
          { key: "shipping", label: "In Delivery" },
          { key: "disputed", label: "Disputed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            data-testid={`filter-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Preparation notifications */}
      {filter === "pending" && filteredOrders.length > 0 && (
        <Card
          className="border-orange-200 bg-orange-50"
          data-testid="preparation-alert"
        >
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Items Need Preparation
            </CardTitle>
            <CardDescription className="text-orange-700">
              {filteredOrders.length} orders are waiting for item preparation
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Orders list */}
      <div className="space-y-4">
        {paginatedOrders.length === 0 ? (
          <Card data-testid="no-orders-message">
            <CardContent className="p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "No orders available at the moment."
                  : `No orders match the "${filter}" filter.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedOrders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-shadow"
              data-testid={`order-card-${order.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.id}</h3>
                        <p className="text-gray-600">{order.customerName}</p>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">
                          {order.items.length} items •{" "}
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Ordered: {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Show items that need preparation */}
                    {order.status === "menunggu persiapan" && (
                      <div
                        className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        data-testid={`preparation-items-${order.id}`}
                      >
                        <h4 className="font-medium text-yellow-800 mb-2">
                          Items to Prepare:
                        </h4>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-yellow-700">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Prepare Now
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <Badge
                        className={getStatusColor(order.status)}
                        data-testid={`status-badge-${order.id}`}
                      >
                        {order.status}
                      </Badge>
                      {order.isDisputed && (
                        <Badge
                          variant="destructive"
                          className="block mt-1"
                          data-testid={`dispute-badge-${order.id}`}
                        >
                          Disputed
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        ETA:{" "}
                        {new Date(order.estimatedDelivery).toLocaleTimeString(
                          "id-ID",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            data-testid={`view-details-${order.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <OrderDetailsModal order={order} />
                      </Dialog>

                      {getActionButton(order)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* Status transition info */}
      <Card className="bg-blue-50 border-blue-200" data-testid="workflow-info">
        <CardHeader>
          <CardTitle className="text-blue-800">Order Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                1
              </div>
              <p className="text-yellow-700">Menunggu Persiapan</p>
            </div>
            <div className="flex-1 h-px bg-blue-300 mx-4"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                2
              </div>
              <p className="text-blue-700">Selesai Disiapkan</p>
            </div>
            <div className="flex-1 h-px bg-blue-300 mx-4"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                3
              </div>
              <p className="text-purple-700">Menunggu Kurir</p>
            </div>
            <div className="flex-1 h-px bg-blue-300 mx-4"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                4
              </div>
              <p className="text-green-700">Sedang Dikirim</p>
            </div>
          </div>
          <p className="text-blue-700 text-xs mt-4 text-center">
            * System automatically transitions from "Selesai Disiapkan" to
            "Menunggu Kurir"
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
