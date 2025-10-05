// Mock data for courier application
export const mockCourier = {
  id: "CR001",
  name: "John Martinez",
  email: "john.martinez@courier.com",
  phone: "+1234567890",
  workLocation: "Downtown District",
  postCode: "10001",
  employeeId: "EMP001",
  joinDate: "2023-01-15",
  vehicleType: "Motorcycle",
  licenseNumber: "MC123456",
  status: "Active",
  totalDeliveries: 342
};

export const mockOrders = [
    {
        id: "ORD001",
        storeId: "STR001",
        storeName: "Pizza Palace",
        storeAddress: "123 Main St, Downtown",
        storeLocation: { lat: 40.7128, lng: -74.0060 },
        customerName: "Sarah Johnson",
        customerAddress: "456 Oak Ave, Apt 2B",
        customerLocation: { lat: 40.7250, lng: -74.0030 },
        customerPhone: "+1987654321",
        orderValue: 28.50,
        deliveryFee: 4.99,
        status: "assigned",
        estimatedTime: "25 mins",
        orderItems: [
            "1x Large Pepperoni Pizza",
            "2x Coke 500ml",
            "1x Garlic Bread"
        ],
        distance: "2.3 km",
        assignedAt: "2024-01-15T14:30:00Z",
        pickupBy: "2024-01-15T15:00:00Z",
        deliverBy: "2024-01-15T15:30:00Z"
    },
    {
        id: "ORD002",
        storeId: "STR002",
        storeName: "Burger House",
        storeAddress: "789 Broadway, Downtown",
        storeLocation: { lat: 40.7589, lng: -73.9851 },
        customerName: "Mike Chen",
        customerAddress: "321 Pine St, Unit 5",
        customerLocation: { lat: 40.7680, lng: -73.9820 },
        customerPhone: "+1456789123",
        orderValue: 18.75,
        deliveryFee: 3.99,
        status: "in_transit",
        estimatedTime: "15 mins",
        orderItems: [
            "1x Classic Burger",
            "1x Medium Fries",
            "1x Milkshake"
        ],
        distance: "1.8 km",
        assignedAt: "2024-01-15T13:45:00Z",
        pickupBy: "2024-01-15T14:15:00Z",
        deliverBy: "2024-01-15T14:45:00Z"
    },
    {
        id: "ORD003",
        storeId: "STR003",
        storeName: "Sushi Express",
        storeAddress: "555 Center Ave, Downtown",
        storeLocation: { lat: 40.7505, lng: -73.9934 },
        customerName: "Emma Davis",
        customerAddress: "888 Elm St, Floor 3",
        customerLocation: { lat: 40.7420, lng: -73.9900 },
        customerPhone: "+1789123456",
        orderValue: 45.20,
        deliveryFee: 5.99,
        status: "ready_for_pickup",
        estimatedTime: "30 mins",
        orderItems: [
            "2x California Roll",
            "1x Salmon Sashimi",
            "1x Miso Soup",
            "2x Green Tea"
        ],
        distance: "3.1 km",
        assignedAt: "2024-01-15T14:45:00Z",
        pickupBy: "2024-01-15T15:15:00Z",
        deliverBy: "2024-01-15T15:45:00Z"
    },
    {
        id: "ORD004",
        storeId: "STR001",
        storeName: "Pizza Palace",
        storeAddress: "123 Main St, Downtown",
        storeLocation: { lat: 40.7128, lng: -74.0060 },
        customerName: "David Wilson",
        customerAddress: "777 Maple Dr, House 12",
        customerLocation: { lat: 40.7350, lng: -74.0100 },
        customerPhone: "+1321654987",
        orderValue: 32.80,
        deliveryFee: 4.99,
        status: "completed",
        estimatedTime: "Delivered",
        orderItems: [
            "1x Medium Margherita Pizza",
            "1x Caesar Salad",
            "3x Sprite 330ml"
        ],
        distance: "2.7 km",
        assignedAt: "2024-01-15T12:30:00Z",
        pickupBy: "2024-01-15T13:00:00Z",
        deliverBy: "2024-01-15T13:30:00Z",
        completedAt: "2024-01-15T13:25:00Z"
    }
];

export const mockNotifications = [
  {
    id: "NOT001",
    type: "new_order",
    title: "New Order Assigned",
    message: "Order #ORD001 from Pizza Palace has been assigned to you",
    orderId: "ORD001",
    timestamp: "2024-01-15T14:30:00Z",
    read: false
  },
  {
    id: "NOT002",
    type: "order_update",
    title: "Order Ready for Pickup",
    message: "Order #ORD003 from Sushi Express is ready for pickup",
    orderId: "ORD003",
    timestamp: "2024-01-15T14:45:00Z",
    read: false
  },
  {
    id: "NOT003",
    type: "system",
    title: "Shift Update",
    message: "Your shift ends in 2 hours. Current deliveries: 3 pending",
    timestamp: "2024-01-15T14:00:00Z",
    read: false
  },
  {
    id: "NOT004",
    type: "customer_update",
    title: "Customer Note",
    message: "Customer for Order #ORD002 added special delivery instructions",
    orderId: "ORD002",
    timestamp: "2024-01-15T13:50:00Z",
    read: false
  },
  {
    id: "NOT005",
    type: "new_order",
    title: "New Order Assigned",
    message: "Order #ORD005 from Burger King has been assigned to you",
    orderId: "ORD005",
    timestamp: "2024-01-15T13:30:00Z",
    read: false
  },
  {
    id: "NOT006",
    type: "order_update",
    title: "Delivery Completed",
    message: "Order #ORD004 has been successfully delivered",
    orderId: "ORD004",
    timestamp: "2024-01-15T13:15:00Z",
    read: false
  },
  {
    id: "NOT007",
    type: "system",
    title: "Payment Received",
    message: "Payment of $45.50 for Order #ORD001 has been confirmed",
    orderId: "ORD001",
    timestamp: "2024-01-15T13:00:00Z",
    read: false
  }
];

export const cancelReasons = [
  { value: "too_far", label: "Store is too far away" },
  { value: "vehicle_issue", label: "Vehicle breakdown/maintenance" },
  { value: "traffic_conditions", label: "Heavy traffic conditions" },
  { value: "weather_conditions", label: "Adverse weather conditions" },
  { value: "personal_emergency", label: "Personal emergency" },
  { value: "overloaded", label: "Already carrying maximum capacity" },
  { value: "unsafe_location", label: "Unsafe delivery location" },
  { value: "other", label: "Other reason" }
];

export const getOrderById = (id) => {
  return mockOrders.find(order => order.id === id);
};

export const getOrdersByStatus = (status) => {
  if (status === 'active') {
    return mockOrders.filter(order => order.status !== 'completed');
  }
  return mockOrders.filter(order => order.status === status);
};

export const getTodaysStats = () => {
  const completed = mockOrders.filter(order => order.status === 'completed').length;
  const pending = mockOrders.filter(order => order.status !== 'completed').length;
  
  return {
    completedDeliveries: completed,
    pendingDeliveries: pending
  };
};