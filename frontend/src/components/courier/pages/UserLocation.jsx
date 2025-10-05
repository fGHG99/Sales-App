import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  Clock,
  Store,
  AlertCircle,
} from "lucide-react";
import { getOrderById } from "../../../utils/mockDataCourier";
import { toast } from "sonner";
import * as maptilersdk from "@maptiler/sdk";

const UserLocation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Set MapTiler API key
    maptilersdk.config.apiKey = "sYpKfEBLoyx6z9knczl3";

    // Get order details
    const orderData = getOrderById(orderId);
    if (!orderData) {
      toast.error("Order not found");
      navigate("/courier/orders");
      return;
    }
    setOrder(orderData);

    // Initialize MapTiler map
    const initializeMap = async () => {
      try {
        if (mapContainer.current && !map.current) {
          map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: [
              orderData.customerLocation.lng,
              orderData.customerLocation.lat,
            ], // longitude, latitude
            zoom: 15,
          });

          // Wait for map to load
          map.current.on("load", () => {
            // Add store marker with blue color and store icon
            const markerElement = document.createElement("div");
            markerElement.className = "store-marker";
            markerElement.innerHTML = `
                <div style="
                    background-color: #2563eb;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    border: 3px solid white;
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                </div>
                `;

            // Create marker
            new maptilersdk.Marker({ element: markerElement })
              .setLngLat([
                orderData.customerLocation.lng,
                orderData.customerLocation.lat,
              ])
              .addTo(map.current);

            // Add popup with store information
            const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(`
                    <div style="padding: 10px; font-family: Arial, sans-serif;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${orderData.storeName}</h3>
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${orderData.customerAddress}</p>
                    <p style="margin: 0; color: #2563eb; font-size: 12px; font-weight: 500;">
                        📍 ${orderData.customerLocation.lat}, ${orderData.customerLocation.lng}
                    </p>
                    </div>
                `);

            // Attach popup to marker on click
            markerElement.addEventListener("click", () => {
              popup
                .setLngLat([
                  orderData.customerLocation.lng,
                  orderData.customerLocation.lat,
                ])
                .addTo(map.current);
            });

            setIsLoading(false);
            toast.success("Navigation loaded successfully");
          });

          // Handle map errors
          map.current.on("error", (e) => {
            console.error("Map error:", e);
            setMapError(true);
            setIsLoading(false);
            toast.error(
              "Failed to load map. Please check your internet connection."
            );
          });
        }
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(true);
        setIsLoading(false);
        toast.error("Failed to initialize map. Please try again.");
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [orderId, navigate]);

  const handleCallCustomer = () => {
    toast.info("Calling Customer", {
      description: `Dialing ${order.customerName}`,
    });
  };

  const handleGetDirections = () => {
    const { lat, lng } = order.storeLocation;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, "_blank");
    toast.info("Opening external navigation...", {
      description: "Launching GPS navigation app",
    });
  };

  if (!order && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Order Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The requested order could not be found.
        </p>
        <Link to="/courier/orders">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/courier/orders">
            <Button variant="outline" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Navigate to {order?.customerAddress}
            </h1>
            <p className="text-gray-600">Order #{order?.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="h-96 lg:h-[500px]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <Navigation className="h-5 w-5 text-blue-600 mr-2" />
                Customer Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <div ref={mapContainer} className="w-full h-full rounded-b-lg">
                {isLoading && (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading MapTiler map...</p>
                    </div>
                  </div>
                )}
                {mapError && (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Failed to load map</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {order && (
            <>
              {/* Store Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Store className="h-5 w-5 text-blue-600 mr-2" />
                    Delivery Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customerAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">
                        Estimated Delivery: {order.estimatedTime}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={handleCallCustomer}
                      variant="outline"
                      className="w-full"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Customer
                    </Button>

                    <Button
                      onClick={handleGetDirections}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Order Value:</span>
                      <span className="font-medium">
                        ${order.orderValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="font-medium">
                        ${order.deliveryFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">{order.distance}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                    <ul className="space-y-1">
                      {order.orderItems.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Customer:
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.customerAddress}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserLocation;
