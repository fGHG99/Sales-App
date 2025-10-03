import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Store, Users, Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { mockAPI } from '../mock/MockData';

const SalesOverview = () => {
  const [chartType, setChartType] = useState('daily');
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardResponse, salesResponse, storesResponse] = await Promise.all([
          mockAPI.reportsAPI.getDashboardMetrics(),
          mockAPI.reportsAPI.getSalesData({ period: chartType }),
          mockAPI.storeAPI.getAll()
        ]);

        setDashboardData(dashboardResponse.data);
        setSalesData(salesResponse.data);
        setStores(storesResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chartType]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  if (!dashboardData || !salesData) {
    return <div className="flex items-center justify-center h-64">Error loading data</div>;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.total_sales)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.sales_growth}%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.active_stores}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.total_stores} total stores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.total_users)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.user_growth}%</span> growth this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.total_products)}</div>
            <p className="text-xs text-muted-foreground">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.today_orders)}</div>
            <p className="text-xs text-muted-foreground">
              Processing orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Overview</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('daily')}
                className={`px-3 py-1 text-sm rounded ${
                  chartType === 'daily' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartType('monthly')}
                className={`px-3 py-1 text-sm rounded ${
                  chartType === 'monthly' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-end justify-between gap-2 border-l border-b border-gray-200 pl-4 pb-4">
            {(chartType === 'daily' ? salesData.daily : salesData.monthly).map((item, index) => {
              const dataSet = chartType === 'daily' ? salesData.daily : salesData.monthly;
              const maxSales = Math.max(...dataSet.map(d => d.sales));
              const height = (item.sales / maxSales) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${chartType === 'daily' ? item.date : item.month}: ${formatCurrency(item.sales)}`}
                  />
                  <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-center">
                    {chartType === 'daily' ? item.date.split('-')[2] : item.month}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Store Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Store Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stores.map((store) => (
              <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{store.label}</h4>
                    <p className="text-sm text-gray-600">{store.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(store.dailySales)}</p>
                    <p className="text-sm text-gray-600">{store.productCount} products</p>
                  </div>
                  <Badge variant={store.status === 'active' ? 'success' : 'secondary'}>
                    {store.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesOverview;