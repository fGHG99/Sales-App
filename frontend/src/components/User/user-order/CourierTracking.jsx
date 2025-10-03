import React, { useState, useEffect } from 'react';
import CourierMap from './CourierMap';
import CourierCard from './CourierCard';
import TrackingInfo from './TrackingInfo';
import { mockTrackingData } from '../../../utils/mockTrackingData';
import { toast } from '../../hook/useToast';

const CourierTracking = () => {
  const [trackingData, setTrackingData] = useState(mockTrackingData);
  const [currentCourierLocation, setCurrentCourierLocation] = useState(
    mockTrackingData.courierInfo.currentLocation
  );

  // Handle courier location updates from map
  const handleCourierLocationUpdate = (newLocation) => {
    setCurrentCourierLocation(newLocation);
    
    // Update tracking data with new location
    setTrackingData(prev => ({
      ...prev,
      courierInfo: {
        ...prev.courierInfo,
        currentLocation: newLocation
      },
      lastUpdated: new Date().toLocaleTimeString()
    }));
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = (whatsappUrl) => {
    window.open(whatsappUrl, '_blank');
    toast({
      title: "Opening WhatsApp",
      description: "Redirecting you to chat with your courier...",
    });
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackingData(prev => ({
        ...prev,
        lastUpdated: new Date().toLocaleTimeString()
      }));
    }, 30000); // Update timestamp every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Delivery
          </h1>
          <p className="text-gray-600">
            Order ID: {trackingData.orderId} • Status: {trackingData.deliveryStatus}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Location
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time tracking of your courier
                </p>
              </div>
              <div className="h-96 lg:h-[500px]">
                <CourierMap
                  userLocation={trackingData.userLocation}
                  courierRoute={trackingData.courierRoute}
                  onCourierLocationUpdate={handleCourierLocationUpdate}
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Courier Card and Info */}
          <div className="space-y-6">
            {/* Courier Card */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Courier
              </h2>
              <CourierCard
                courierInfo={trackingData.courierInfo}
                estimatedArrival={trackingData.estimatedTimeOfArrival}
                onWhatsAppClick={handleWhatsAppClick}
              />
            </div>

            {/* Hidden Tracking Info Component - Not displayed but available for reuse */}
            <TrackingInfo
              estimatedArrival={trackingData.estimatedTimeOfArrival}
              liveTrackingActive={trackingData.liveTrackingActive}
              lastUpdated={trackingData.lastUpdated}
              deliveryStatus={trackingData.deliveryStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierTracking;