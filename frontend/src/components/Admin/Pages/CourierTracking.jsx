import React, { useState } from "react";
import {
  Truck,
  MapPin,
  Phone,
  Star,
  Clock,
  Package,
  Navigation,
  RefreshCw,
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
import MapComponent from "../Map-Component";
import { couriers, orders, formatDate } from "../../../utils/mockDataAdmin";
import Pagination from "../../Pagination";

const CourierTracking = () => {
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock user locations for delivery addresses
  const getDeliveryLocation = (orderId) => {
    const locationMap = {
      "ORD-001": { lat: -6.2088, lng: 106.8456 }, // Jakarta Pusat
      "ORD-002": { lat: -6.2614, lng: 106.7809 }, // Jakarta Selatan
      "ORD-003": { lat: -6.1944, lng: 106.8229 }, // Jakarta Pusat
      "ORD-004": { lat: -6.2467, lng: 106.8294 }, // Jakarta Selatan
    };
    return locationMap[orderId] || { lat: -6.2088, lng: 106.8456 };
  };

  const filteredCouriers = couriers.filter((courier) => {
    if (filter === "all") return true;
    if (filter === "active")
      return (
        courier.status === "aktif" || courier.status === "dalam perjalanan"
      );
    if (filter === "available") return courier.activeDeliveries.length === 0;
    if (filter === "busy") return courier.activeDeliveries.length > 0;
    return true;
  });

  const handleTrackCourier = (courier) => {
    setSelectedCourier(courier);
    setShowMap(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      aktif: "bg-green-100 text-green-800",
      "dalam perjalanan": "bg-blue-100 text-blue-800",
      istirahat: "bg-gray-100 text-gray-800",
      offline: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getCourierOrders = (courierId) => {
    return orders.filter((order) => order.courierId === courierId);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCouriers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCouriers = filteredCouriers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6" data-testid="courier-tracking">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Courier Tracking</h1>
        <p className="text-gray-600">
          Monitor courier locations and delivery progress
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "All Couriers" },
          { key: "active", label: "Active" },
          { key: "available", label: "Available" },
          { key: "busy", label: "On Delivery" },
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-couriers-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{couriers.length}</p>
                <p className="text-sm text-gray-600">Total Couriers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="active-couriers-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Navigation className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {
                    couriers.filter(
                      (c) =>
                        c.status === "aktif" || c.status === "dalam perjalanan"
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="deliveries-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {couriers.reduce(
                    (sum, c) => sum + c.activeDeliveries.length,
                    0
                  )}
                </p>
                <p className="text-sm text-gray-600">Active Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Couriers list */}
      <div className="space-y-4">
        {paginatedCouriers.length === 0 ? (
          <Card data-testid="no-couriers-message">
            <CardContent className="p-8 text-center">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No couriers found
              </h3>
              <p className="text-gray-500">
                No couriers match the selected filter criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedCouriers.map((courier) => {
            const courierOrders = getCourierOrders(courier.id);
            return (
              <Card
                key={courier.id}
                className="hover:shadow-md transition-shadow"
                data-testid={`courier-card-${courier.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        {/* Courier basic info */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Truck className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold">
                              {courier.name}
                            </h3>
                            <Badge
                              className={getStatusColor(courier.status)}
                              data-testid={`courier-status-${courier.id}`}
                            >
                              {courier.status}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>ID: {courier.id}</span>
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {courier.phone}
                            </div>
                            <div className="flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {courier.rating} ({courier.totalDeliveries}{" "}
                              deliveries)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Current deliveries */}
                      {courier.activeDeliveries.length > 0 && (
                        <div
                          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                          data-testid={`active-deliveries-${courier.id}`}
                        >
                          <h4 className="font-medium text-blue-800 mb-2">
                            Current Deliveries (
                            {courier.activeDeliveries.length})
                          </h4>
                          <div className="space-y-2">
                            {courier.activeDeliveries.map((orderId) => {
                              const order = orders.find(
                                (o) => o.id === orderId
                              );
                              if (!order) return null;

                              return (
                                <div
                                  key={orderId}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-medium">{orderId}</p>
                                    <p className="text-sm text-gray-600">
                                      To: {order.customerName}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge
                                      className={`text-xs ${
                                        order.status === "sedang dikirim"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {order.status}
                                    </Badge>
                                    <p className="text-xs text-gray-500 mt-1">
                                      ETA:{" "}
                                      {new Date(
                                        order.estimatedDelivery
                                      ).toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleTrackCourier(courier)}
                        disabled={!courier.currentLocation}
                        data-testid={`track-button-${courier.id}`}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Track Location
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Refresh courier location - in real app this would call API
                          console.log("Refreshing location for", courier.id);
                        }}
                        data-testid={`refresh-location-${courier.id}`}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* Map modal */}
      {showMap && selectedCourier && (
        <MapComponent
          courierData={selectedCourier}
          userLocation={
            selectedCourier.activeDeliveries.length > 0
              ? getDeliveryLocation(selectedCourier.activeDeliveries[0])
              : null
          }
          onClose={() => {
            setShowMap(false);
            setSelectedCourier(null);
          }}
        />
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200" data-testid="tracking-info">
        <CardHeader>
          <CardTitle className="text-blue-800">Tracking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              • Click "Track Location" to view real-time courier position on map
            </p>
            <p>
              • Map shows courier location (blue marker) and delivery
              destination (red marker)
            </p>
            <p>
              • ETA is calculated based on current location and traffic
              conditions
            </p>
            <p>
              • For privacy, customer details are not shown to protect user
              information
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourierTracking;
