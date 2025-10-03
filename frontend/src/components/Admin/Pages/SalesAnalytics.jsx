import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  DollarSign, 
  Package, 
  BarChart3,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
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
  Bar 
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { salesData, salesDetails, orders, formatCurrency } from '../../../utils/mockDataAdmin';

const SalesAnalytics = () => {
  const [dateRange, setDateRange] = useState('week'); // week, month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Generate more comprehensive sales data for different time periods
  const generateSalesData = (range) => {
    const today = new Date();
    let data = [];
    
    if (range === 'week') {
      const startDate = startOfWeek(today);
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Use existing data or generate mock data
        const existingData = salesData.find(item => item.date === dateStr);
        data.push(existingData || {
          date: dateStr,
          revenue: Math.floor(Math.random() * 10000000) + 2000000,
          orders: Math.floor(Math.random() * 20) + 5
        });
      }
    } else if (range === 'month') {
      const startDate = startOfMonth(today);
      const endDate = endOfMonth(today);
      const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= dayCount; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        data.push({
          date: dateStr,
          revenue: Math.floor(Math.random() * 15000000) + 3000000,
          orders: Math.floor(Math.random() * 25) + 8
        });
      }
    } else if (range === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= dayCount; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        data.push({
          date: dateStr,
          revenue: Math.floor(Math.random() * 12000000) + 2500000,
          orders: Math.floor(Math.random() * 22) + 6
        });
      }
    } else {
      data = salesData;
    }
    
    return data;
  };

  const chartData = useMemo(() => generateSalesData(dateRange), [dateRange, customStartDate, customEndDate]);

  // Calculate statistics
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const averageDailyRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{format(new Date(label), 'dd MMM yyyy')}</p>
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
  const exportToExcel = () => {
    const startDate = chartData[0]?.date || format(new Date(), 'yyyy-MM-dd');
    const endDate = chartData[chartData.length - 1]?.date || format(new Date(), 'yyyy-MM-dd');
    const year = new Date().getFullYear();
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Title sheet data
    const titleData = [
      [`Geek Sales Report from ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')} ${year}`],
      [''],
      ['Sales Summary'],
      ['Total Revenue', formatCurrency(totalRevenue)],
      ['Total Orders', totalOrders],
      ['Average Order Value', formatCurrency(averageOrderValue)],
      ['Average Daily Revenue', formatCurrency(averageDailyRevenue)],
      [''],
      ['Daily Sales Breakdown'],
      ['Date', 'Revenue (IDR)', 'Orders Count', 'Average Order Value']
    ];
    
    // Add daily data
    chartData.forEach(item => {
      const avgOrderValue = item.orders > 0 ? item.revenue / item.orders : 0;
      titleData.push([
        format(new Date(item.date), 'dd MMM yyyy'),
        item.revenue,
        item.orders,
        avgOrderValue
      ]);
    });
    
    // Add detailed items if available
    titleData.push([''], ['Detailed Item Sales']);
    titleData.push(['Date', 'Order ID', 'Item Name', 'Quantity', 'Unit Price', 'Total Price']);
    
    salesDetails.forEach(sale => {
      sale.items.forEach(item => {
        titleData.push([
          format(new Date(sale.date), 'dd MMM yyyy'),
          sale.orderId,
          item.name,
          item.quantity,
          item.price,
          item.total
        ]);
      });
    });
    
    const ws = XLSX.utils.aoa_to_sheet(titleData);
    
    // Set column widths
    ws['!cols'] = [
      { width: 15 }, // Date
      { width: 20 }, // Revenue/Order ID
      { width: 25 }, // Item Name
      { width: 10 }, // Quantity
      { width: 15 }, // Unit Price
      { width: 15 }  // Total Price
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    
    // Generate file and download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Geek_Sales_Report_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6" data-testid="sales-analytics">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600">Monitor sales performance and revenue trends</p>
          </div>
          <Button 
            onClick={exportToExcel}
            data-testid="export-excel-button"
          >
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
            
            {['week', 'month', 'custom'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid={`date-range-${range}`}
              >
                {range === 'week' ? 'This Week' : 
                 range === 'month' ? 'This Month' : 'Custom Range'}
              </button>
            ))}
            
            {dateRange === 'custom' && (
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
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
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
                <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(averageDailyRevenue)}</p>
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
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
                  fill="url(#revenueGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy')}
                  />
                  <Bar dataKey="orders" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Combined line chart */}
        <Card data-testid="combined-metrics-chart">
          <CardHeader>
            <CardTitle>Revenue vs Orders</CardTitle>
            <CardDescription>Combined view of revenue and order trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                  />
                  <YAxis 
                    yAxisId="revenue" 
                    orientation="left"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <YAxis 
                    yAxisId="orders" 
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    yAxisId="revenue"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="orders"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
            <p>• <strong>Title Page:</strong> Report covers selected date range with company branding</p>
            <p>• <strong>Summary Metrics:</strong> Total revenue, orders, averages, and key performance indicators</p>
            <p>• <strong>Daily Breakdown:</strong> Date-wise revenue and order counts with calculated averages</p>
            <p>• <strong>Detailed Items:</strong> Individual product sales with quantities and pricing information</p>
            <p>• <strong>Formatted Output:</strong> Professional Excel formatting with proper column widths and headers</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;