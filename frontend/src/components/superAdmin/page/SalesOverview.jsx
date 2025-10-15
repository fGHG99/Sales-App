import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Store,
  Package,
  ShoppingCart,
  Calendar,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import Pagination from "../../Pagination";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import {
  getSuperAdminAnalyticsSummary,
  getSuperAdminDailySales,
} from "../../../services/superAdminAnalyticsService";
import { getAllStores } from "../../../services/storeService";

const SalesOverview = () => {
  const [chartType, setChartType] = useState("daily"); // daily, monthly, allTime
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dailySalesData, setDailySalesData] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state for store performance
  const [currentPage, setCurrentPage] = useState(1);
  const [storesPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine date range based on chart type
        let dateRange;
        if (chartType === "daily") {
          dateRange = "week";
        } else if (chartType === "monthly") {
          dateRange = "month";
        } else if (chartType === "allTime") {
          dateRange = "all";
        } else {
          dateRange = "week";
        }

        const [analyticsResponse, salesResponse] = await Promise.all([
          getSuperAdminAnalyticsSummary(dateRange),
          getSuperAdminDailySales(dateRange),
        ]);

        setAnalyticsData(analyticsResponse.data);
        setDailySalesData(salesResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chartType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData || !dailySalesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  // Custom tooltip formatter for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">
            {chartType === "daily"
              ? format(new Date(label), "dd MMM yyyy")
              : label}
          </p>
          <p className="text-blue-600">
            Revenue: {formatCurrency(payload[0]?.value || 0)}
          </p>
          {payload[0]?.payload?.orders && (
            <p className="text-gray-600 text-sm">
              Orders: {payload[0].payload.orders}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Pagination logic for stores
  const totalPages = Math.ceil(stores.length / storesPerPage);
  const startIndex = (currentPage - 1) * storesPerPage;
  const endIndex = startIndex + storesPerPage;
  const currentStores = stores.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {chartType === "daily"
                ? "Last 7 days"
                : chartType === "monthly"
                ? "Last 30 days"
                : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.totalOrders)}
            </div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.averageDailyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sales Overview
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType("daily")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartType === "daily"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setChartType("monthly")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartType === "monthly"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setChartType("allTime")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartType === "allTime"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Store Performance */}
      {/* <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Performance
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, stores.length)} of{" "}
                {stores.length} stores
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Store
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Address
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Total Revenue
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">
                    Total Orders
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentStores.map((store) => (
                  <tr
                    key={store.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {store.name}
                          </h4>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {store.address || "No address"}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(store.totalRevenue)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <p className="text-sm text-gray-600">
                        {formatNumber(store.totalOrders)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={store.isActive ? "success" : "secondary"}>
                        {store.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
      {/* {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>  */}
    </div>
  );
};

export default SalesOverview;
