import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Package,
  BarChart3,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { formatCurrency } from "../../../utils/mockDataAdmin";
import {
  getSalesSummary,
  getDailySalesData,
  getSalesExportData,
} from "../../../services/adminService";

const SalesAnalytics = () => {
  const [dateRange, setDateRange] = useState("week"); // week, month, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState({
    summary: null,
    dailySales: [],
  });

  // Fetch sales data from API
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true);

        const [summaryRes, dailyRes] = await Promise.all([
          getSalesSummary(dateRange, customStartDate, customEndDate),
          getDailySalesData(dateRange, customStartDate, customEndDate),
        ]);

        setApiData({
          summary: summaryRes.data,
          dailySales: dailyRes.data,
        });
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [dateRange, customStartDate, customEndDate]);

  const chartData = apiData.dailySales;

  // Get statistics from API
  const totalRevenue = apiData.summary?.totalRevenue || 0;
  const totalOrders = apiData.summary?.totalOrders || 0;
  const averageOrderValue = apiData.summary?.averageOrderValue || 0;
  const averageDailyRevenue = apiData.summary?.averageDailyRevenue || 0;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">
            {format(new Date(label), "dd MMM yyyy")}
          </p>
          <p className="text-blue-600">
            Revenue: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-green-600">
            Orders: {payload[1]?.value || payload[0]?.payload?.orders || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  // Export to Excel functionality
  const exportToExcel = async () => {
    try {
      setIsLoading(true);

      const exportRes = await getSalesExportData(
        dateRange,
        customStartDate,
        customEndDate
      );
      const { summary, dailyBreakdown, detailedItems } = exportRes.data;

      const wb = XLSX.utils.book_new();

      // Title sheet with date range from API
      const titleData = [
        [
          `Geek Sales Report from ${summary.periodStart} to ${summary.periodEnd}`,
        ],
        [""],
        ["Sales Summary (Gross Revenue)"],
        ["Total Revenue", formatCurrency(summary.totalRevenue)],
        ["Total Orders", summary.totalOrders],
        ["Average Order Value", formatCurrency(summary.averageOrderValue)],
        ["Average Daily Revenue", formatCurrency(summary.averageDailyRevenue)],
        [""],
        ["Daily Sales Breakdown"],
        ["Date", "Revenue (IDR)", "Orders Count", "Average Order Value"],
      ];

      // Add daily data
      dailyBreakdown.forEach((item) => {
        titleData.push([
          item.date,
          item.revenue,
          item.ordersCount,
          item.averageOrderValue,
        ]);
      });

      // Add detailed items (condensed per order)
      titleData.push([""], ["Detailed Order Items"]);
      titleData.push([
        "Date",
        "Order ID",
        "Items",
        "Subtotal",
        "Delivery Fee",
        "Total",
      ]);

      detailedItems.forEach((item) => {
        titleData.push([
          item.date,
          item.orderId,
          item.items,
          item.subtotal,
          item.deliveryFee,
          item.totalPrice,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(titleData);

      ws["!cols"] = [
        { width: 15 },
        { width: 40 },
        { width: 50 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `Geek_Sales_Report_${summary.periodStart}_to_${summary.periodEnd}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="sales-analytics">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Analytics
            </h1>
            <p className="text-gray-600">
              Monitor sales performance and revenue trends
            </p>
          </div>
          <Button onClick={exportToExcel} data-testid="export-excel-button">
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Date range selector */}
      <Card data-testid="date-range-selector">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Date Range Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Period:</span>
            </div>

            {["week", "month", "custom"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateRange === range
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                data-testid={`date-range-${range}`}
              >
                {range === "week"
                  ? "This Week"
                  : range === "month"
                  ? "This Month"
                  : "Custom Range"}
              </button>
            ))}

            {dateRange === "custom" && (
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  data-testid="custom-start-date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  data-testid="custom-end-date"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="total-revenue-metric">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-sm text-gray-600">Total Revenue (Gross)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="total-orders-metric">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="avg-order-value-metric">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {formatCurrency(averageOrderValue)}
                </p>
                <p className="text-sm text-gray-600">Avg Order Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="daily-avg-revenue-metric">
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {formatCurrency(averageDailyRevenue)}
                </p>
                <p className="text-sm text-gray-600">Daily Avg Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue trend chart */}
      <Card data-testid="revenue-trend-chart">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Daily revenue performance over selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="revenueGradient"
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
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders and revenue comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily orders */}
        <Card data-testid="daily-orders-chart">
          <CardHeader>
            <CardTitle>Daily Orders</CardTitle>
            <CardDescription>Number of orders per day</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        format(new Date(value), "dd/MM")
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        format(new Date(value), "dd MMM yyyy")
                      }
                    />
                    <Bar dataKey="orders" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Combined line chart */}
        <Card data-testid="combined-metrics-chart">
          <CardHeader>
            <CardTitle>Revenue vs Orders</CardTitle>
            <CardDescription>
              Combined view of revenue and order trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        format(new Date(value), "dd/MM")
                      }
                    />
                    <YAxis
                      yAxisId="revenue"
                      orientation="left"
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <YAxis yAxisId="orders" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data export info */}
      <Card className="bg-blue-50 border-blue-200" data-testid="export-info">
        <CardHeader>
          <CardTitle className="text-blue-800">Excel Export Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              • <strong>Title Page:</strong> Report covers selected date range
              with company branding
            </p>
            <p>
              • <strong>Summary Metrics:</strong> Total revenue, orders,
              averages, and key performance indicators
            </p>
            <p>
              • <strong>Daily Breakdown:</strong> Date-wise revenue and order
              counts with calculated averages
            </p>
            <p>
              • <strong>Detailed Items:</strong> Individual product sales with
              quantities and pricing information
            </p>
            <p>
              • <strong>Formatted Output:</strong> Professional Excel formatting
              with proper column widths and headers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;
