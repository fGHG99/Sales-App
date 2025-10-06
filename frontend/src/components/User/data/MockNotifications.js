// Mock data for notifications
export const transactionNotifications = [
  {
    id: "1",
    type: "delivery",
    title: "Pesanan Sampai Di Tujuan",
    description:
      "Pesanan dengan nomor A1N3CIRZJ sudah sampai di tujuan. Pastikan pesananmu sesuai.",
    timestamp: "2 hari yang lalu",
    category: "Grocery",
    status: "success",
    isRead: false,
    product: {
      name: "Chitato Snack Potato Chips Cheese Supreme 68G",
      image:
        "https://images.pexels.com/photos/4518666/pexels-photo-4518666.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1",
    },
  },
  {
    id: "2",
    type: "payment",
    title: "Pembayaran Berhasil",
    description: "Pembayaran untuk pesanan #ORD123456 telah berhasil diproses.",
    timestamp: "3 hari yang lalu",
    category: "Electronics",
    status: "success",
    isRead: true,
    product: {
      name: "Wireless Bluetooth Earbuds Premium Quality",
      image:
        "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1",
    },
  },
  {
    id: "3",
    type: "order",
    title: "Pesanan Sedang Diproses",
    description:
      "Pesanan #ORD789012 sedang dalam tahap persiapan dan akan segera dikirim.",
    timestamp: "5 jam yang lalu",
    category: "Fashion",
    status: "pending",
    isRead: false,
    product: {
      name: "Cotton T-Shirt Premium Collection",
      image:
        "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1",
    },
  },
  {
    id: "4",
    type: "delivery",
    title: "Paket Dalam Perjalanan",
    description:
      "Paket dengan nomor resi JNE12345678 sedang dalam perjalanan menuju alamat tujuan.",
    timestamp: "1 hari yang lalu",
    category: "Books",
    status: "pending",
    isRead: true,
    product: {
      name: "JavaScript: The Definitive Guide 7th Edition",
      image:
        "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1",
    },
  },
  {
    id: "5",
    type: "order",
    title: "Pesanan Dikonfirmasi",
    description:
      "Pesanan #ORD456789 telah dikonfirmasi seller dan akan segera diproses.",
    timestamp: "6 jam yang lalu",
    category: "Home & Garden",
    status: "pending",
    isRead: false,
    product: {
      name: "Ceramic Dinner Plate Set - Modern Design",
      image:
        "https://images.pexels.com/photos/1449773/pexels-photo-1449773.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1",
    },
  },
  {
    id: "6",
    type: "payment",
    title: "Pengembalian Dana Diproses",
    description:
      "Pengembalian dana untuk pesanan #ORD234567 sedang diproses dan akan masuk ke rekening dalam 3-5 hari kerja.",
    timestamp: "4 jam yang lalu",
    category: "Sports",
    status: "pending",
    isRead: false,
    product: {
      name: "Running Shoes Professional Training Edition",
      image:
        "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1",
    },
  },
  {
    id: "7",
    type: "delivery",
    title: "Pesanan Telah Tiba di Gudang",
    description:
      "Pesanan dengan nomor tracking XYZ987654 telah tiba di gudang sortir terdekat dan akan segera dikirim.",
    timestamp: "12 jam yang lalu",
    category: "Beauty",
    status: "pending",
    isRead: true,
    product: {
      name: "Premium Skincare Set - Complete Routine",
      image:
        "https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1",
    },
  },
];

export const informationNotifications = [
  {
    id: "1",
    type: "profile",
    title: "Nama Profil Diperbarui",
    description:
      'Nama profil Anda telah berhasil diubah dari "John Doe" menjadi "John Smith".',
    timestamp: "1 hari yang lalu",
    status: "success",
    isRead: false,
  },
  {
    id: "2",
    type: "security",
    title: "Login dari Perangkat Baru",
    description:
      "Akun Anda telah diakses dari perangkat baru. Jika ini bukan Anda, segera ubah password.",
    timestamp: "4 hari yang lalu",
    status: "warning",
    isRead: true,
  },
  {
    id: "3",
    type: "account",
    title: "Email Berhasil Diverifikasi",
    description:
      "Alamat email baru john.smith@example.com telah berhasil diverifikasi.",
    timestamp: "1 minggu yang lalu",
    status: "info",
    isRead: true,
  },
  {
    id: "4",
    type: "security",
    title: "Kata Sandi Berhasil Diubah",
    description:
      "Kata sandi akun Anda telah berhasil diperbarui. Pastikan untuk menggunakan kata sandi yang kuat.",
    timestamp: "3 hari yang lalu",
    status: "success",
    isRead: false,
  },
  {
    id: "5",
    type: "account",
    title: "Nomor Telepon Diverifikasi",
    description:
      "Nomor telepon +62 812-3456-7890 telah berhasil diverifikasi dan ditambahkan ke akun Anda.",
    timestamp: "5 hari yang lalu",
    status: "info",
    isRead: true,
  },
  {
    id: "6",
    type: "profile",
    title: "Foto Profil Diperbarui",
    description:
      "Foto profil Anda telah berhasil diubah. Foto baru akan muncul di seluruh platform dalam beberapa menit.",
    timestamp: "2 jam yang lalu",
    status: "success",
    isRead: false,
  },
  {
    id: "7",
    type: "security",
    title: "Aktivitas Login Terdeteksi",
    description:
      "Login berhasil dari lokasi Jakarta, Indonesia menggunakan Chrome Browser. Waktu: 14:30 WIB.",
    timestamp: "8 jam yang lalu",
    status: "info",
    isRead: false,
  },
];
