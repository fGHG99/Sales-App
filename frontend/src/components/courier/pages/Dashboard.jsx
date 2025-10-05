import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Package,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Truck,
  X,
} from "lucide-react";
import {
  mockOrders,
  mockNotifications,
  getTodaysStats,
  mockCourier,
} from "../../../utils/mockDataCourier";
import { toast } from "sonner";
import CancelOrderModal from "../modal/CancelOrderModal";
import NotificationCard from "./NotificationCard";
import Pagination from "../../Pagination";

const CourierDashboard = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [stats, setStats] = useState(getTodaysStats());
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const courier = mockCourier;
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const recentNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  // Hitung total pages berdasarkan jumlah notifikasi
  const totalPages = Math.ceil(recentNotifications.length / ITEMS_PER_PAGE);

  // Handler untuk perubahan page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    // Simulate real-time notifications for new orders
    const unreadNotifications = notifications.filter(
      (n) => !n.read && n.type === "new_order"
    );
    if (unreadNotifications.length > 0) {
      unreadNotifications.forEach((notification) => {
        if (notification.id === "NOT001") {
          // Show toast only for the first unread
          toast.info("New Order Assigned!", {
            description:
              "Order #ORD001 from Pizza Palace has been assigned to you.",
            action: {
              label: "View Order",
              onClick: () => (window.location.href = "/orders"),
            },
          });
        }
      });
    }
  }, []);

  const handleOrderAction = (orderId, action) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          let newStatus = order.status;
          switch (action) {
            case "accept":
              newStatus = "accepted";
              toast.success("Order accepted successfully!");
              break;
            case "pickup":
              newStatus = "in_transit";
              toast.success("Order picked up! En route to customer.");
              break;
            case "complete":
              newStatus = "completed";
              toast.success("Order delivered successfully!");
              break;
            default:
              break;
          }
          return { ...order, status: newStatus };
        }
        return order;
      })
    );
  };

  const handleCancelOrder = (orderId, cancelData) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: "cancelled",
            cancelReason: cancelData.reasonLabel,
            cancelNotes: cancelData.notes,
            cancelledAt: cancelData.timestamp,
          };
        }
        return order;
      })
    );

    // Update stats
    setStats(getTodaysStats());
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { color: "bg-yellow-100 text-yellow-800", text: "New" },
      accepted: { color: "bg-blue-100 text-blue-800", text: "Accepted" },
      ready_for_pickup: {
        color: "bg-orange-100 text-orange-800",
        text: "Ready",
      },
      in_transit: {
        color: "bg-purple-100 text-purple-800",
        text: "In Transit",
      },
      completed: { color: "bg-green-100 text-green-800", text: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", text: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.assigned;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getActionButton = (order) => {
    if (order.status === "cancelled") {
      return null;
    }

    switch (order.status) {
      case "assigned":
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleOrderAction(order.id, "accept")}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Accept Order
            </Button>
            <Button
              onClick={() => setCancelModalOrder(order)}
              size="sm"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        );
      case "accepted":
      case "ready_for_pickup":
        return (
          <div className="flex space-x-3">
            <Link to={`/courier/order/${order.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Navigate to Store
              </Button>
            </Link>
            <Button
              key="pickup"
              size="sm"
              onClick={() => handleOrderAction(order.id, "pickup")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Package className="w-4 h-4 mr-1" />
              Mark Picked Up
            </Button>
          </div>
        );
      case "in_transit":
        return (
          <div className="flex space-x-3">
            <Link key="navigate" to={`/courier/customer-location/order/${order.id}`}>
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Customer Location
              </Button>
            </Link>
            <Button
              onClick={() => handleOrderAction(order.id, "complete")}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Mark Delivered
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const activeOrders = orders.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {courier.name}!
        </h1>
        <p className="text-gray-600">
          Your delivery zone: {courier.workLocation} • {courier.postCode}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Active Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingDeliveries}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Completed Today
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedDeliveries}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Truck className="h-5 w-5 text-blue-600 mr-2" />
              Active Orders
              <Badge className="ml-auto bg-blue-100 text-blue-800">
                {activeOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active orders at the moment</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        #{order.id}
                      </h4>
                      <p className="text-sm text-gray-600">{order.storeName}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {order.customerAddress}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Package className="h-4 w-4 mr-2" />$
                      {order.orderValue.toFixed(2)} + $
                      {order.deliveryFee.toFixed(2)} fee
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-gray-500">
                      {order.distance} from {order.storeName}
                    </span>
                    {getActionButton(order)}
                  </div>

                  {order.status === "cancelled" && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <strong>Cancelled:</strong> {order.cancelReason}
                      {order.cancelNotes && (
                        <p className="mt-1">{order.cancelNotes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {activeOrders.length > 0 && (
              <div className="pt-2">
                <Link to="/orders">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              Recent Notifications
              <Badge className="ml-auto bg-red-100 text-red-800">
                {notifications.filter((n) => !n.read).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications
              .slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              )
              .map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                />
              ))}
          </CardContent>
          {totalPages > 1 && (
            <div className="px-6 pb-6 pt-2">
              <Pagination
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        order={cancelModalOrder}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
};

export default CourierDashboard;
