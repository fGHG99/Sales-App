import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";
import OrderStatusTracker from "./OrderStatusTracker";

export default function OrderCheckout() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const handleTrack = () => {
    const orderId = `ORD-${Date.now()}`;
    navigate(`/order/track/${orderId}`);
  };

  const mockOrderData = {
    orderId: orderId || "ORD-2025-001234",
    orderDate: "2025-10-02T14:30:00",
    items: [
      {
        id: "1",
        name: "Premium Wireless Headphones",
        price: 29999,
        quantity: 1,
        image: "/wireless-headphones.png",
      },
      {
        id: "2",
        name: "Smart Fitness Watch",
        price: 19999,
        quantity: 2,
        image: "/fitness-watch.png",
      },
      {
        id: "3",
        name: "Bluetooth Speaker",
        price: 8999,
        quantity: 1,
        image: "/bluetooth-speaker.png",
      },
    ],
    subtotal: 78996,
    deliveryFee: 12000,
    serviceFee: 2000,
    total: 92996,
    deliveryAddress: {
      name: "Home",
      address: "123 Main Street, New York, NY 10001",
      phone: "+62 812-3456-7890",
    },
    paymentMethod: "Credit Card (**** 1234)",
    currentStatus: 2,
    statusHistory: [
      {
        status: "Pesanan diterima toko",
        timestamp: "2025-10-02T14:30:00",
        completed: true,
      },
      {
        status: "Pesanan sedang disiapkan",
        timestamp: "2025-10-02T14:45:00",
        completed: true,
      },
      {
        status: "Menunggu kurir",
        timestamp: null,
        completed: false,
      },
      {
        status: "Kurir menuju alamat pengiriman",
        timestamp: null,
        completed: false,
      },
      {
        status: "Pesanan sampai",
        timestamp: null,
        completed: false,
      },
      {
        status: "Pesanan dibayar",
        timestamp: null,
        completed: false,
      },
      {
        status: "Pesanan selesai",
        timestamp: null,
        completed: false,
      },
    ],
  };

  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusLabel = (index) => {
    if (index < mockOrderData.currentStatus) return "Selesai";
    if (index === mockOrderData.currentStatus) return "Proses";
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Button
          variant="ghost"
          className="mb-6 -ml-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Detail Pesanan
              </h1>
              <p className="text-muted-foreground">
                Lacak status pesanan Anda secara real-time
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">ID Pesanan</span>
              <span className="text-lg font-semibold text-foreground">
                {mockOrderData.orderId}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <OrderStatusTracker
              statusHistory={mockOrderData.statusHistory}
              currentStatus={mockOrderData.currentStatus}
              formatDateTime={formatDateTime}
              getStatusLabel={getStatusLabel}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Item Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockOrderData.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Qty: {item.quantity}
                        </p>
                        <p className="font-semibold text-foreground">
                          {formatIDR(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatIDR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                    {index < mockOrderData.items.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Alamat Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    {mockOrderData.deliveryAddress.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mockOrderData.deliveryAddress.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mockOrderData.deliveryAddress.phone}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{mockOrderData.paymentMethod}</p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tanggal Pesanan
                    </span>
                    <span className="text-foreground font-medium">
                      {formatDateTime(mockOrderData.orderDate).split(",")[0]}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal ({mockOrderData.items.length} item)
                    </span>
                    <span className="text-foreground">
                      {formatIDR(mockOrderData.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Kirim</span>
                    <span className="text-foreground">
                      {formatIDR(mockOrderData.deliveryFee)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Layanan</span>
                    <span className="text-foreground">
                      {formatIDR(mockOrderData.serviceFee)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-foreground text-base">
                      Total
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {formatIDR(mockOrderData.total)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                    variant="outline"
                    onClick={handleTrack}
                  >
                    Lacak Pesanan
                  </Button>
                  <Button className="w-full" variant="outline">
                    Butuh Bantuan?
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center pt-2">
                  Pesanan akan dibatalkan otomatis jika tidak dibayar dalam 24
                  jam
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
