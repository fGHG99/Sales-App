import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { mockOrders } from "../utils/mockDataOrder";
import Pagination from "./Pagination";

const OrderHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;

  // Initial loading with 0.5s delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Debounce search with 0.5s delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const orderStatuses = [
    { value: "all", label: "All Orders" },
    { value: "waiting_payment", label: "Waiting for Payment" },
    { value: "payment_completed", label: "Payment Completed" },
    { value: "processing", label: "Processing" },
    { value: "on_delivery", label: "On Delivery" },
    { value: "arrived", label: "Arrived" },
    { value: "completed", label: "Completed" },
  ];

  const getStatusColor = (status) => {
    const colors = {
      waiting_payment: "bg-yellow-100 text-yellow-800 border-yellow-200",
      payment_completed: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-purple-100 text-purple-800 border-purple-200",
      on_delivery: "bg-orange-100 text-orange-800 border-orange-200",
      arrived: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatCurrency = (amount) => {
    return `Rp ${parseFloat(amount).toLocaleString("id-ID")}`;
  };

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        order.items.some((item) =>
          item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      const matchesDate =
        !selectedDate ||
        format(new Date(order.orderDate), "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd");

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [debouncedSearch, selectedStatus, selectedDate]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

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
        No Orders Yet
      </h3>
      <p className="text-gray-500 mb-6">
        Try ordering something at{" "}
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          Geek Sales
        </a>
      </p>
    </div>
  );

  const OrderDetailModal = ({ order }) => (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Details - #{order.id}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Badge className={getStatusColor(order.status)}>
            {orderStatuses.find((s) => s.value === order.status)?.label}
          </Badge>
          <div className="text-sm text-gray-500">
            {format(new Date(order.orderDate), "PPP")} at{" "}
            {format(new Date(order.orderDate), "p")}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Order Items</h4>
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1">
                <h5 className="font-medium">{item.name}</h5>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(item.price)}
                </div>
                <div className="text-sm text-gray-500">
                  Total: {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount:</span>
            <span>{formatCurrency(order.totalAmount)}</span>
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
        {filteredOrders.length === 0 ? (
          <NoOrdersComponent />
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </p>
            </div>

            {currentOrders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold">#{order.id}</span>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {
                          orderStatuses.find((s) => s.value === order.status)
                            ?.label
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {format(
                        new Date(order.orderDate),
                        "MMM dd, yyyy"
                      )} at {format(new Date(order.orderDate), "HH:mm")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={order.items[0].image}
                        alt={order.items[0].name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div>
                        <h3 className="font-medium">{order.items[0].name}</h3>
                        {order.items.length > 1 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 1} more item
                            {order.items.length > 2 ? "s" : ""}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-gray-900">
                          Total: {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <OrderDetailModal order={order} />
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  totalPages={totalPages}
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
