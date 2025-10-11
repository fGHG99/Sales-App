import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import {
  CalendarIcon,
  Search,
  ChevronRight,
  Package,
  Clock,
  MapPin,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "./Pagination";
import api from "../utils/api";

const OrderHistory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
    showing: 0,
  });
  const ordersPerPage = 6;

  // Debounce status and date changes (500ms delay)
  const debouncedStatus = useDebounce(selectedStatus, 500);
  const debouncedDate = useDebounce(selectedDate, 500);
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch orders from API with filters and pagination
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = {
          page: currentPage,
          limit: ordersPerPage,
        };

        // Add status filter if not "all"
        if (debouncedStatus && debouncedStatus !== "all") {
          params.status = debouncedStatus;
        }

        // Add date filter
        if (debouncedDate) {
          params.date = format(debouncedDate, "yyyy-MM-dd");
        }

        // Add search filter
        if (debouncedSearch && debouncedSearch.trim() !== "") {
          params.search = debouncedSearch.trim();
        }

        const response = await api.get("/order/my-orders", { params });

        // Debug: Log orders to check courier tracking data
        console.log("📦 Orders fetched:", response.data.orders);
        response.data.orders?.forEach((order, idx) => {
          console.log(`Order ${idx}:`, {
            id: order.id,
            status: order.orderStatus,
            hasCourier: !!order.courier,
            courier: order.courier,
            hasLatLng: !!(
              order.deliveryAddress?.latitude &&
              order.deliveryAddress?.longitude
            ),
            deliveryAddress: order.deliveryAddress,
          });
        });

        setOrders(response.data.orders || []);
        setPagination(
          response.data.pagination || {
            total: 0,
            totalPages: 0,
            hasMore: false,
            showing: 0,
          }
        );
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.message || "Failed to fetch orders");
        setOrders([]);
        setPagination({
          total: 0,
          totalPages: 0,
          hasMore: false,
          showing: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, debouncedStatus, debouncedDate, debouncedSearch]);

  const orderStatuses = [
    { value: "all", label: "All Orders" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PREPARATION", label: "In Preparation" },
    { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
    { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DISPUTED", label: "Disputed" },
    { value: "CANCELED", label: "Canceled" },
  ];

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      IN_PREPARATION: "bg-blue-100 text-blue-800 border-blue-200",
      READY_FOR_PICKUP: "bg-purple-100 text-purple-800 border-purple-200",
      OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800 border-orange-200",
      DELIVERED: "bg-green-100 text-green-800 border-green-200",
      COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
      DISPUTED: "bg-red-100 text-red-800 border-red-200",
      CANCELED: "bg-gray-100 text-gray-800 border-gray-200",
      GRACE_PERIOD: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatCurrency = (amount) => {
    return `Rp ${parseFloat(amount).toLocaleString("id-ID")}`;
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedStatus, selectedDate]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const NoOrdersComponent = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-24 w-24 text-gray-300 mb-6" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {error ? "Error Loading Orders" : "No Orders Yet"}
      </h3>
      <p className="text-gray-500 mb-6">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : (
          <>
            Try ordering something at{" "}
            <a
              href="/"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Geek Sales
            </a>
          </>
        )}
      </p>
    </div>
  );

  const OrderDetailModal = ({ order }) => (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Details - #{order.id.slice(0, 8)}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Badge className={getStatusColor(order.orderStatus)}>
            {orderStatuses.find((s) => s.value === order.orderStatus)?.label ||
              order.orderStatus}
          </Badge>
          <div className="text-sm text-gray-500">
            {format(new Date(order.createdAt), "PPP")} at{" "}
            {format(new Date(order.createdAt), "p")}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Order Items</h4>
          {order.orderItems && Array.isArray(order.orderItems) ? (
            order.orderItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium">{item.productName}</h5>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(item.pricePerItem)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: {formatCurrency(item.total)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No items found</p>
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
            <span>Total Amount:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Cash Amount:</span>
            <span>{formatCurrency(order.cashAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Change:</span>
            <span>{formatCurrency(order.changeAmount)}</span>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="font-semibold">Delivery Information</h4>
          <div className="text-sm">
            <p className="font-medium">Type: {order.deliveryType}</p>
            {order.deliveryAddress && (
              <div className="mt-2 text-gray-600">
                <p className="font-medium">{order.deliveryAddress.label}</p>
                <p>{order.deliveryAddress.recipientName}</p>
                <p>{order.deliveryAddress.recipientPhone}</p>
                <p>{order.deliveryAddress.fullAddress}</p>
                <p>
                  {order.deliveryAddress.city}, {order.deliveryAddress.province}{" "}
                  {order.deliveryAddress.postalCode}
                </p>
              </div>
            )}
            {order.pickupStore && (
              <div className="mt-2 text-gray-600">
                <p className="font-medium">Pickup Store:</p>
                <p>{order.pickupStore.name}</p>
                {order.pickupStore.address && (
                  <>
                    <p>{order.pickupStore.address.fullAddress}</p>
                    <p>
                      {order.pickupStore.address.city},{" "}
                      {order.pickupStore.address.province}
                    </p>
                  </>
                )}
                {order.pickupTime && (
                  <p className="mt-1">
                    Pickup Time: {format(new Date(order.pickupTime), "PPP p")}
                  </p>
                )}
              </div>
            )}
            {order.courier && (
              <div className="mt-2 text-gray-600">
                <p className="font-medium">Courier:</p>
                <p>{order.courier.name}</p>
                <p>{order.courier.phone}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Skeleton className="h-9 w-48" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>

        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by order ID or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {orderStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover
          open={isCalendarOpen}
          onOpenChange={(open) => {
            setIsCalendarOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full lg:w-64 justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => {
                console.log("Calendar date selected:", date);
                setSelectedDate(date);
              }}
              defaultMonth={selectedDate || new Date()}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(selectedStatus !== "all" || selectedDate) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedStatus("all");
              setSelectedDate(undefined);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <NoOrdersComponent />
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ordersPerPage + 1}-
                {Math.min(currentPage * ordersPerPage, pagination.total)} of{" "}
                {pagination.total} orders
              </p>
            </div>

            {orders.map((order) => {
              const firstItem = order.orderItems?.[0];
              const itemsCount = order.orderItems?.length || 0;

              return (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-gray-600" />
                          <span className="font-semibold">
                            #{order.id.slice(0, 8)}
                          </span>
                        </div>
                        <Badge className={getStatusColor(order.orderStatus)}>
                          {orderStatuses.find(
                            (s) => s.value === order.orderStatus
                          )?.label || order.orderStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {format(
                          new Date(order.createdAt),
                          "MMM dd, yyyy"
                        )} at {format(new Date(order.createdAt), "HH:mm")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {firstItem?.productName || "Order Items"}
                          </h3>
                          {itemsCount > 1 && (
                            <p className="text-sm text-gray-500">
                              +{itemsCount - 1} more item
                              {itemsCount > 2 ? "s" : ""}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-gray-900">
                            Total: {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Track Courier Button - Navigate to tracking page */}
                        {order.courier &&
                          order.deliveryAddress?.latitude &&
                          order.deliveryAddress?.longitude &&
                          (order.orderStatus === "OUT_FOR_DELIVERY" ||
                            order.orderStatus === "READY_FOR_PICKUP") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/order/success/${order.id}`)
                              }
                              className="flex items-center gap-2"
                            >
                              <Truck className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Lacak Kurir
                              </span>
                            </Button>
                          )}

                        {/* Order Details Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-2">
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                          <OrderDetailModal order={order} />
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination Component */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
