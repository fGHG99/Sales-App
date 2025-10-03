import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { orders, couriers, disputes, salesData, formatCurrency } from '../../../utils/mockDataAdmin';

const AdminDashboard = () => {
  // Calculate dashboard statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'menunggu persiapan').length;
  const activeDisputes = disputes.filter(dispute => dispute.status === 'dalam proses').length;
  const activeCouriers = couriers.filter(courier => courier.status === 'aktif' || courier.status === 'dalam perjalanan').length;
  
  const todayRevenue = salesData[salesData.length - 1]?.revenue || 0;
  const weeklyRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0);

  const stats = [
    {
      title: 'Total Orders Today',
      value: totalOrders,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Preparation',
      value: pendingOrders,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Active Couriers',
      value: activeCouriers,
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Disputes',
      value: activeDisputes,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Today Revenue',
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Weekly Revenue',
      value: formatCurrency(weeklyRevenue),
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const recentOrders = orders.slice(0, 5);
  const urgentIssues = [
    ...orders.filter(order => order.status === 'menunggu persiapan').slice(0, 3),
    ...disputes.filter(dispute => dispute.status === 'dalam proses' && dispute.priority === 'tinggi')
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your business operations and key metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow" data-testid={`stat-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notifications for orders to prepare */}
      {pendingOrders > 0 && (
        <Card className="border-yellow-200 bg-yellow-50" data-testid="preparation-notification">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertCircle className="mr-2 h-5 w-5" />
              Orders Waiting for Preparation
            </CardTitle>
            <CardDescription className="text-yellow-700">
              You have {pendingOrders} orders that need to be prepared
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders
                .filter(order => order.status === 'menunggu persiapan')
                .map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium">Order {order.id}</p>
                      <p className="text-sm text-gray-600">
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        New Order
                      </span>
                      <Link 
                        to="/admin/orders" 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        data-testid={`prepare-order-${order.id}`}
                      >
                        Prepare →
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card data-testid="recent-orders-card">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'selesai' ? 'bg-green-100 text-green-800' :
                      order.status === 'sedang dikirim' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'dalam sengketa' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link 
                to="/admin/orders" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                data-testid="view-all-orders"
              >
                View all orders →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Urgent issues */}
        <Card data-testid="urgent-issues-card">
          <CardHeader>
            <CardTitle>Urgent Issues</CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentIssues.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  No urgent issues at the moment
                </div>
              ) : (
                urgentIssues.map((issue, index) => (
                  <div key={issue.id || index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {issue.status ? `Order ${issue.id}` : `Dispute ${issue.id}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {issue.status ? 
                          `${issue.items?.length || 0} items need preparation` : 
                          issue.issue
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Urgent
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(issue.createdAt).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {urgentIssues.length > 0 && (
              <div className="mt-4 space-x-4">
                <Link 
                  to="/admin/orders" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  data-testid="manage-orders"
                >
                  Manage Orders →
                </Link>
                <Link 
                  to="/admin/disputes" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  data-testid="manage-disputes"
                >
                  Manage Disputes →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card data-testid="quick-actions-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/admin/orders" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              data-testid="quick-action-orders"
            >
              <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Manage Orders</p>
            </Link>
            <Link 
              to="/admin/couriers" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              data-testid="quick-action-couriers"
            >
              <Truck className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Track Couriers</p>
            </Link>
            <Link 
              to="/admin/disputes" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              data-testid="quick-action-disputes"
            >
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-medium">Handle Disputes</p>
            </Link>
            <Link 
              to="/admin/analytics" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              data-testid="quick-action-analytics"
            >
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">View Analytics</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;