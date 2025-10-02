// Mock data for courier tracking application

// Mock coordinates for courier movement simulation (around a city area)
export const mockCourierRoute = [
  { lat: 40.7128, lng: -74.0060, timestamp: Date.now() },
  { lat: 40.7138, lng: -74.0070, timestamp: Date.now() + 10000 },
  { lat: 40.7148, lng: -74.0080, timestamp: Date.now() + 20000 },
  { lat: 40.7158, lng: -74.0090, timestamp: Date.now() + 30000 },
  { lat: 40.7168, lng: -74.0100, timestamp: Date.now() + 40000 },
  { lat: 40.7178, lng: -74.0110, timestamp: Date.now() + 50000 },
  { lat: 40.7188, lng: -74.0120, timestamp: Date.now() + 60000 },
  { lat: 40.7198, lng: -74.0130, timestamp: Date.now() + 70000 },
  { lat: 40.7208, lng: -74.0140, timestamp: Date.now() + 80000 },
  { lat: 40.7218, lng: -74.0150, timestamp: Date.now() + 90000 }
];

// Static user location
export const mockUserLocation = {
  lat: 40.7128,
  lng: -74.0060
};

// Mock courier information
export const mockCourierInfo = {
  id: "CR001",
  name: "Alex Rodriguez",
  phoneNumber: "+1234567890",
  vehicleLicensePlate: "NYC-4521",
  profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  estimatedArrival: "15 mins",
  status: "On the way",
  currentLocation: mockCourierRoute[0]
};

// Mock tracking data that would normally come from backend
export const mockTrackingData = {
  orderId: "ORD-2024-001",
  estimatedTimeOfArrival: "15 mins",
  liveTrackingActive: true,
  lastUpdated: new Date().toLocaleTimeString(),
  deliveryStatus: "In Transit",
  courierInfo: mockCourierInfo,
  userLocation: mockUserLocation,
  courierRoute: mockCourierRoute
};