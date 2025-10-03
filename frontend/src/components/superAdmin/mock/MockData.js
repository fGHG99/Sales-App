// Mock data for SuperAdmin Dashboard

export const mockStores = [
  {
    id: 'store_001',
    label: 'Jakarta Central Store',
    address: 'Jl. Thamrin No. 123, Jakarta Pusat',
    openHour: '06:00',
    closeHour: '22:00',
    adminId: 'admin_001',
    adminName: 'Ahmad Rizki',
    status: 'active',
    productCount: 450,
    dailySales: 15750000
  },
  {
    id: 'store_002',
    label: 'Surabaya Mall Store',
    address: 'Jl. Pemuda No. 45, Surabaya',
    openHour: '08:00',
    closeHour: '21:00',
    adminId: 'admin_002',
    adminName: 'Siti Nurhaliza',
    status: 'active',
    productCount: 380,
    dailySales: 12300000
  },
  {
    id: 'store_003',
    label: 'Bandung Plaza Store',
    address: 'Jl. Asia Afrika No. 67, Bandung',
    openHour: '07:00',
    closeHour: '22:00',
    adminId: 'admin_003',
    adminName: 'Budi Santoso',
    status: 'inactive',
    productCount: 420,
    dailySales: 0
  },
  {
    id: 'store_004',
    label: 'Yogyakarta Mall Store',
    address: 'Jl. Malioboro No. 89, Yogyakarta',
    openHour: '08:00',
    closeHour: '21:30',
    adminId: 'admin_004',
    adminName: 'Dewi Sartika',
    status: 'active',
    productCount: 320,
    dailySales: 9800000
  },
  {
    id: 'store_005',
    label: 'Medan Central Store',
    address: 'Jl. Gatot Subroto No. 234, Medan',
    openHour: '06:30',
    closeHour: '22:30',
    adminId: 'admin_005',
    adminName: 'Ravi Kumar',
    status: 'active',
    productCount: 510,
    dailySales: 18200000
  },
  {
    id: 'store_006',
    label: 'Bali Beach Store',
    address: 'Jl. Sunset Road No. 156, Denpasar, Bali',
    openHour: '07:30',
    closeHour: '23:00',
    adminId: 'admin_006',
    adminName: 'Made Sutrisna',
    status: 'active',
    productCount: 280,
    dailySales: 14500000
  },
  {
    id: 'store_007',
    label: 'Semarang Square Store',
    address: 'Jl. Pandanaran No. 78, Semarang',
    openHour: '08:00',
    closeHour: '21:00',
    adminId: 'admin_007',
    adminName: 'Lisa Permata',
    status: 'active',
    productCount: 390,
    dailySales: 11750000
  },
  {
    id: 'store_008',
    label: 'Makassar Harbor Store',
    address: 'Jl. Sultan Hasanuddin No. 45, Makassar',
    openHour: '06:00',
    closeHour: '22:00',
    adminId: 'admin_008',
    adminName: 'Abdul Rahman',
    status: 'active',
    productCount: 350,
    dailySales: 13200000
  },
  {
    id: 'store_009',
    label: 'Palembang Mall Store',
    address: 'Jl. Sudirman No. 123, Palembang',
    openHour: '08:30',
    closeHour: '21:30',
    adminId: 'admin_009',
    adminName: 'Farah Nabila',
    status: 'inactive',
    productCount: 260,
    dailySales: 0
  },
  {
    id: 'store_010',
    label: 'Balikpapan City Store',
    address: 'Jl. Jenderal Sudirman No. 67, Balikpapan',
    openHour: '07:00',
    closeHour: '22:00',
    adminId: 'admin_010',
    adminName: 'Indra Gunawan',
    status: 'active',
    productCount: 445,
    dailySales: 16800000
  }
];

export const mockAccounts = [
  {
    id: 'user_001',
    type: 'user',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+6281234567890',
    status: 'active',
    registeredDate: '2024-01-15',
    lastLogin: '2024-09-15'
  },
  {
    id: 'courier_001',
    type: 'courier',
    name: 'Muhammad Ali',
    email: 'ali.courier@company.com',
    phone: '+6285678901234',
    status: 'active',
    registeredDate: '2024-02-10',
    lastLogin: '2024-09-14',
    deliveryArea: 'Jakarta Central'
  },
  {
    id: 'admin_001',
    type: 'admin',
    name: 'Ahmad Rizki',
    email: 'ahmad.rizki@company.com',
    phone: '+6287654321098',
    status: 'active',
    registeredDate: '2024-01-01',
    lastLogin: '2024-09-15',
    storeId: 'store_001'
  }
];

export const mockRoles = [
  {
    id: 'role_001',
    name: 'Super Admin',
    type: 'superadmin',
    permissions: ['all'],
    accessKeys: ['CREATE_STORE', 'DELETE_USER', 'MODIFY_PRODUCTS', 'VIEW_REPORTS', 'SYSTEM_CONFIG']
  },
  {
    id: 'role_002',
    name: 'Store Admin',
    type: 'admin',
    permissions: ['store_management', 'order_management', 'product_view'],
    accessKeys: ['MANAGE_ORDERS', 'VIEW_PRODUCTS', 'UPDATE_INVENTORY']
  },
  {
    id: 'role_003',
    name: 'Courier',
    type: 'courier',
    permissions: ['delivery_management'],
    accessKeys: ['VIEW_ORDERS', 'UPDATE_DELIVERY_STATUS']
  }
];

export const mockOrders = [
  {
    id: 'ORD_001',
    customerId: 'user_001',
    customerName: 'John Doe',
    storeId: 'store_001',
    storeName: 'Jakarta Central Store',
    status: 'delivered',
    total: 245000,
    items: 3,
    orderDate: '2024-09-14T10:30:00',
    deliveryDate: '2024-09-14T15:45:00'
  },
  {
    id: 'ORD_002',
    customerId: 'user_002',
    customerName: 'Jane Smith',
    storeId: 'store_002',
    storeName: 'Surabaya Mall Store',
    status: 'processing',
    total: 180000,
    items: 2,
    orderDate: '2024-09-15T09:15:00',
    deliveryDate: null
  }
];

export const mockProducts = [
  {
    id: 'PRD_001',
    name: 'Beras Premium 5kg',
    description: 'Beras premium kualitas terbaik untuk keluarga',
    sellingPrice: 75000,
    quantity: 150,
    category: 'Makanan Pokok',
    isActive: true,
    isPerishable: false,
    batch: 'BATCH_001',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop'
  },
  {
    id: 'PRD_002',
    name: 'Susu UHT 1L',
    description: 'Susu UHT segar dan bergizi',
    sellingPrice: 18000,
    quantity: 85,
    category: 'Minuman',
    isActive: true,
    isPerishable: true,
    batch: 'BATCH_002',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop'
  }
];

// Mock Dashboard Metrics for SalesOverview
export const mockDashboardMetrics = {
  total_sales: 2580750000,
  sales_growth: 15.3,
  active_stores: 8,
  total_stores: 10,
  total_users: 15420,
  user_growth: 12.7,
  total_products: 1250,
  today_orders: 127
};

export const mockSalesData = {
  daily: [
    { date: '2024-09-10', sales: 25000000 },
    { date: '2024-09-11', sales: 22000000 },
    { date: '2024-09-12', sales: 28000000 },
    { date: '2024-09-13', sales: 24000000 },
    { date: '2024-09-14', sales: 30000000 },
    { date: '2024-09-15', sales: 27000000 }
  ],
  monthly: [
    { month: 'Jan', sales: 750000000 },
    { month: 'Feb', sales: 680000000 },
    { month: 'Mar', sales: 820000000 },
    { month: 'Apr', sales: 790000000 },
    { month: 'May', sales: 850000000 },
    { month: 'Jun', sales: 920000000 },
    { month: 'Jul', sales: 880000000 },
    { month: 'Aug', sales: 940000000 },
    { month: 'Sep', sales: 980000000 }
  ]
};

export const mockSystemConfig = {
  emailAgent: 'admin@klikstore.com',
  emailPassword: '••••••••••••',
  smsNumber: '+6281234567890',
  deliveryFee: 15000,
  minimumOrder: 50000,
  maxDeliveryDistance: 10
};

export const mockAuditLogs = [
  {
    id: 'log_001',
    action: 'UPDATE_PRODUCT',
    adminId: 'admin_001',
    adminName: 'Ahmad Rizki',
    description: 'Updated product price for PRD_001',
    timestamp: '2024-09-15T14:30:00',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'log_002',
    action: 'DELETE_USER',
    adminId: 'superadmin_001',
    adminName: 'Super Admin',
    description: 'Deleted user account user_005',
    timestamp: '2024-09-15T13:15:00',
    ipAddress: '192.168.1.101'
  }
];

// Mock API Functions
export const mockAPI = {
  // Reports API Mock
  reportsAPI: {
    getDashboardMetrics: () => {
      return Promise.resolve({
        data: mockDashboardMetrics
      });
    },
    getSalesData: (params) => {
      return Promise.resolve({
        data: mockSalesData
      });
    }
  },
  
  // Store API Mock
  storeAPI: {
    getAll: () => {
      return Promise.resolve({
        data: mockStores
      });
    }
  }
};