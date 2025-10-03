// Mock data for the admin dashboard

export const orders = [
    {
        id: 'ORD-001',
        items: [
            { name: 'Gaming Mouse', quantity: 2, price: 299000 },
            { name: 'Mechanical Keyboard', quantity: 1, price: 899000 }
        ],
        status: 'menunggu persiapan',
        totalAmount: 1497000,
        createdAt: new Date('2025-01-15T10:30:00'),
        deliveryAddress: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110',
        courierId: 'CUR-001',
        customerId: 'CUST-001',
        customerName: 'Ahmad Rahman',
        estimatedDelivery: new Date('2025-01-16T15:00:00'),
        isPrepared: false,
        isDisputed: false
    },
    {
        id: 'ORD-002',
        items: [
            { name: 'Laptop Stand', quantity: 1, price: 350000 },
            { name: 'Webcam HD', quantity: 1, price: 750000 }
        ],
        status: 'sedang dikirim',
        totalAmount: 1100000,
        createdAt: new Date('2025-01-15T09:15:00'),
        deliveryAddress: 'Jl. Gatot Subroto No. 456, Jakarta Selatan, DKI Jakarta 12930',
        courierId: 'CUR-002',
        customerId: 'CUST-002',
        customerName: 'Siti Nurhaliza',
        estimatedDelivery: new Date('2025-01-15T17:30:00'),
        isPrepared: true,
        isDisputed: false
    },
    {
        id: 'ORD-003',
        items: [
            { name: 'Wireless Earbuds', quantity: 1, price: 299000 }
        ],
        status: 'pesanan selesai disiapkan',
        totalAmount: 299000,
        createdAt: new Date('2025-01-15T08:45:00'),
        deliveryAddress: 'Jl. Thamrin No. 789, Jakarta Pusat, DKI Jakarta 10310',
        courierId: 'CUR-003',
        customerId: 'CUST-003',
        customerName: 'Budi Santoso',
        estimatedDelivery: new Date('2025-01-15T14:00:00'),
        isPrepared: true,
        isDisputed: false
    },
    {
        id: 'ORD-004',
        items: [
            { name: 'Monitor 24 inch', quantity: 1, price: 2500000 }
        ],
        status: 'dalam sengketa',
        totalAmount: 2500000,
        createdAt: new Date('2025-01-14T16:20:00'),
        deliveryAddress: 'Jl. Kemang Raya No. 321, Jakarta Selatan, DKI Jakarta 12560',
        courierId: 'CUR-001',
        customerId: 'CUST-004',
        customerName: 'Lisa Permata',
        estimatedDelivery: new Date('2025-01-15T11:00:00'),
        isPrepared: true,
        isDisputed: true,
        disputeReason: 'Barang rusak saat diterima'
    },
    {
        id: 'ORD-005',
        items: [
            { name: 'Gaming Mouse', quantity: 1, price: 299000 },
            { name: 'Wireless Earbuds', quantity: 2, price: 299000 }
        ],
        status: 'menunggu kurir',
        totalAmount: 897000,
        createdAt: new Date('2025-01-14T13:45:00'),
        deliveryAddress: 'Jl. Rasuna Said No. 654, Jakarta Selatan, DKI Jakarta 12940',
        courierId: 'CUR-003',
        customerId: 'CUST-005',
        customerName: 'Ravi Kumar',
        estimatedDelivery: new Date('2025-01-15T16:30:00'),
        isPrepared: true,
        isDisputed: false
    },
    {
        id: 'ORD-006',
        items: [
            { name: 'Mechanical Keyboard', quantity: 1, price: 899000 },
            { name: 'Laptop Stand', quantity: 1, price: 350000 }
        ],
        status: 'selesai',
        totalAmount: 1249000,
        createdAt: new Date('2025-01-13T15:20:00'),
        deliveryAddress: 'Jl. Kuningan No. 987, Jakarta Selatan, DKI Jakarta 12950',
        courierId: 'CUR-002',
        customerId: 'CUST-006',
        customerName: 'Maria Gonzalez',
        estimatedDelivery: new Date('2025-01-14T12:00:00'),
        isPrepared: true,
        isDisputed: false
    }
];

export const couriers = [
    {
        id: 'CUR-001',
        name: 'Muhammad Rizki',
        phone: '+62812-3456-7890',
        currentLocation: { lat: -6.2088, lng: 106.8456 },
        status: 'aktif',    
        activeDeliveries: ['ORD-001', 'ORD-004'],
        rating: 4.8,
        totalDeliveries: 156
    },
    {
        id: 'CUR-002',
        name: 'Indra Gunawan',
        phone: '+62813-9876-5432',
        currentLocation: { lat: -6.2614, lng: 106.7809 },
        status: 'dalam perjalanan',
        activeDeliveries: ['ORD-002'],
        rating: 4.9,
        totalDeliveries: 203
    },
    {
        id: 'CUR-003',
        name: 'Andi Pratama',
        phone: '+62814-5678-9012',
        currentLocation: { lat: -6.1944, lng: 106.8229 },
        status: 'istirahat',
        activeDeliveries: [],
        rating: 4.7,
        totalDeliveries: 98
    },
    {
        id: 'CUR-004',
        name: 'Dewi Sartika',
        phone: '+62815-2468-1357',
        currentLocation: { lat: -6.2297, lng: 106.8467 },
        status: 'aktif',
        activeDeliveries: ['ORD-005'],
        rating: 4.6,
        totalDeliveries: 124
    },
    {
        id: 'CUR-005',
        name: 'Bambang Suryadi',
        phone: '+62816-1357-2468',
        currentLocation: { lat: -6.1751, lng: 106.8650 },
        status: 'dalam perjalanan',
        activeDeliveries: ['ORD-006'],
        rating: 4.9,
        totalDeliveries: 189
    },
    {
        id: 'CUR-006',
        name: 'Sari Wulandari',
        phone: '+62817-9753-8642',
        currentLocation: { lat: -6.2385, lng: 106.8304 },
        status: 'istirahat',
        activeDeliveries: [],
        rating: 4.8,
        totalDeliveries: 145
    }
];

export const disputes = [
    {
        id: 'DISP-001',
        orderId: 'ORD-004',
        customerId: 'CUST-004',
        customerName: 'Lisa Permata',
        issue: 'Barang rusak saat diterima',
        status: 'dalam proses',
        createdAt: new Date('2025-01-14T18:30:00'),
        adminNotes: 'Sedang mengkonfirmasi dengan kurir dan warehouse',
        priority: 'tinggi'
    },
    {
        id: 'DISP-002',
        orderId: 'ORD-005',
        customerId: 'CUST-005',
        customerName: 'Ravi Kumar',
        issue: 'Pengiriman terlambat lebih dari 2 hari',
        status: 'selesai',
        createdAt: new Date('2025-01-13T14:20:00'),
        resolvedAt: new Date('2025-01-14T10:15:00'),
        adminNotes: 'Masalah telah diselesaikan, customer mendapat kompensasi',
        priority: 'sedang'
    },
    {
        id: 'DISP-003',
        orderId: 'ORD-007',
        customerId: 'CUST-007',
        customerName: 'Farid Hidayat',
        issue: 'Barang tidak sesuai dengan pesanan',
        status: 'dalam proses',
        createdAt: new Date('2025-01-15T11:45:00'),
        adminNotes: 'Menunggu konfirmasi dari customer untuk proses return',
        priority: 'sedang'
    },
    {
        id: 'DISP-004',
        orderId: 'ORD-008',
        customerId: 'CUST-008',
        customerName: 'Nina Safitri',
        issue: 'Alamat pengiriman salah, kurir tidak dapat menemukan lokasi',
        status: 'selesai',
        createdAt: new Date('2025-01-12T16:30:00'),
        resolvedAt: new Date('2025-01-13T09:20:00'),
        adminNotes: 'Alamat telah diperbaiki, pesanan berhasil dikirim ulang',
        priority: 'rendah'
    },
    {
        id: 'DISP-005',
        orderId: 'ORD-009',
        customerId: 'CUST-009',
        customerName: 'Hendra Wijaya',
        issue: 'Pembayaran double charge',
        status: 'dalam proses',
        createdAt: new Date('2025-01-15T14:15:00'),
        adminNotes: 'Sedang meninjau riwayat pembayaran customer',
        priority: 'tinggi'
    },
    {
        id: 'DISP-006',
        orderId: 'ORD-010',
        customerId: 'CUST-010',
        customerName: 'Putri Maharani',
        issue: 'Kurir tidak profesional, paket dilempar',
        status: 'selesai',
        createdAt: new Date('2025-01-11T08:30:00'),
        resolvedAt: new Date('2025-01-12T15:45:00'),
        adminNotes: 'Kurir telah ditegur dan mendapat pelatihan ulang',
        priority: 'tinggi'
    }
];

// Sales data for analytics
export const salesData = [
  { date: '2025-01-09', revenue: 5400000, orders: 12 },
  { date: '2025-01-10', revenue: 7200000, orders: 18 },
  { date: '2025-01-11', revenue: 3600000, orders: 8 },
  { date: '2025-01-12', revenue: 8100000, orders: 21 },
  { date: '2025-01-13', revenue: 6300000, orders: 15 },
  { date: '2025-01-14', revenue: 9000000, orders: 24 },
  { date: '2025-01-15', revenue: 4500000, orders: 11 }
];

// Detailed sales items for export
export const salesDetails = [
  {
    date: '2025-01-15',
    orderId: 'ORD-001',
    items: [
      { name: 'Gaming Mouse', quantity: 2, price: 299000, total: 598000 },
      { name: 'Mechanical Keyboard', quantity: 1, price: 899000, total: 899000 }
    ],
    orderTotal: 1497000
  },
  {
    date: '2025-01-15',
    orderId: 'ORD-002',
    items: [
      { name: 'Laptop Stand', quantity: 1, price: 350000, total: 350000 },
      { name: 'Webcam HD', quantity: 1, price: 750000, total: 750000 }
    ],
    orderTotal: 1100000
  },
  {
    date: '2025-01-15',
    orderId: 'ORD-003',
    items: [
      { name: 'Wireless Earbuds', quantity: 1, price: 299000, total: 299000 }
    ],
    orderTotal: 299000
  }
];

export const productCatalog = [
  { id: 'PROD-001', name: 'Gaming Mouse', category: 'Accessories', stock: 45, price: 299000 },
  { id: 'PROD-002', name: 'Mechanical Keyboard', category: 'Accessories', stock: 23, price: 899000 },
  { id: 'PROD-003', name: 'Laptop Stand', category: 'Accessories', stock: 12, price: 350000 },
  { id: 'PROD-004', name: 'Webcam HD', category: 'Electronics', stock: 8, price: 750000 },
  { id: 'PROD-005', name: 'Wireless Earbuds', category: 'Audio', stock: 34, price: 299000 },
  { id: 'PROD-006', name: 'Monitor 24 inch', category: 'Electronics', stock: 6, price: 2500000 }
];

// Utility functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const getStatusColor = (status) => {
  const statusColors = {
    'menunggu persiapan': 'bg-yellow-100 text-yellow-800',
    'pesanan selesai disiapkan': 'bg-blue-100 text-blue-800',
    'menunggu kurir': 'bg-purple-100 text-purple-800',
    'sedang dikirim': 'bg-green-100 text-green-800',
    'selesai': 'bg-gray-100 text-gray-800',
    'dalam sengketa': 'bg-red-100 text-red-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};