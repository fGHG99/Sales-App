import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  MapPin, 
  Phone, 
  Package,
  Navigation,
  CheckCircle2,
  Truck,
  AlertTriangle,
  X
} from 'lucide-react';
import { mockOrders } from '../../../utils/mockDataCourier';
import { toast } from 'sonner';
import CancelOrderModal from '../modal/CancelOrderModal';

const OrdersPage = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);

  const handleOrderAction = (orderId, action) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          let newStatus = order.status;
          switch (action) {
            case 'accept':
              newStatus = 'accepted';
              toast.success('Order accepted successfully!');
              break;
            case 'pickup':
              newStatus = 'in_transit';
              toast.success('Order picked up! En route to customer.');
              break;
            case 'complete':
              newStatus = 'completed';
              toast.success('Order delivered successfully!');
              break;
            case 'call_customer':
              toast.info('Calling customer...', {
                description: `Dialing ${order.customerPhone}`
              });
              break;
            default:
              break;
          }
          return { ...order, status: newStatus };
        }
        return order;
      })
    );
  };

  const handleCancelOrder = (orderId, cancelData) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          return { 
            ...order, 
            status: 'cancelled',
            cancelReason: cancelData.reasonLabel,
            cancelNotes: cancelData.notes,
            cancelledAt: cancelData.timestamp
          };
        }
        return order;
      })
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'assigned': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'New Assignment', icon: AlertTriangle },
      'accepted': { color: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Accepted', icon: CheckCircle2 },
      'ready_for_pickup': { color: 'bg-orange-100 text-orange-800 border-orange-300', text: 'Ready for Pickup', icon: Package },
      'in_transit': { color: 'bg-purple-100 text-purple-800 border-purple-300', text: 'In Transit', icon: Truck },
      'completed': { color: 'bg-green-100 text-green-800 border-green-300', text: 'Completed', icon: CheckCircle2 },
      'cancelled': { color: 'bg-red-100 text-red-800 border-red-300', text: 'Cancelled', icon: X }
    };
    
    const config = statusConfig[status] || statusConfig.assigned;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getOrderActions = (order) => {
    const actions = [];
    
    if (order.status === 'cancelled') {
      return [];
    }
    
    switch (order.status) {
      case 'assigned':
        actions.push(
          <Button 
            key="accept"
            onClick={() => handleOrderAction(order.id, 'accept')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Accept Order
          </Button>,
          <Button 
            key="cancel"
            onClick={() => setCancelModalOrder(order)}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Order
          </Button>
        );
        break;
        
      case 'accepted':
      case 'ready_for_pickup':
        actions.push(
          <Link key="navigate" to={`/courier/order/${order.id}`}>
            <Button 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigate to Store
            </Button>
          </Link>,
          <Button 
            key="pickup"
            onClick={() => handleOrderAction(order.id, 'pickup')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Package className="w-4 h-4 mr-2" />
            Mark Picked Up
          </Button>,
          <Button 
            key="cancel"
            onClick={() => setCancelModalOrder(order)}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        );
        break;
        
      case 'in_transit':
        actions.push(
          <Button 
            key="call"
            onClick={() => handleOrderAction(order.id, 'call_customer')}
            variant="outline"
            className="border-gray-600 text-gray-600 hover:bg-gray-50"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Customer
          </Button>,
          <Link key="navigate" to={`/courier/customer-location/order/${order.id}`}>
            <Button 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Customer Location
            </Button>
          </Link>
        );
        break;
        
      default:
        break;
    }
    
    return actions;
  };

  const filterOrdersByStatus = (status) => {
    if (status === 'active') {
      return orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
    }
    return orders.filter(order => order.status === status);
  };

  const OrderCard = ({ order }) => (
    <Card className="mb-4 transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">#{order.id}</h3>
            <p className="text-gray-600 font-medium">{order.storeName}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {getStatusBadge(order.status)}
          </div>
        </div>

        {order.status === 'cancelled' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800 mb-1">
              <X className="h-4 w-4 mr-2" />
              <span className="font-medium">Order Cancelled</span>
            </div>
            <p className="text-sm text-red-700">
              <strong>Reason:</strong> {order.cancelReason}
            </p>
            {order.cancelNotes && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Notes:</strong> {order.cancelNotes}
              </p>
            )}
            <p className="text-xs text-red-600 mt-1">
              Cancelled at: {new Date(order.cancelledAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Store Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Pickup Location</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{order.storeAddress}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Delivery Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">{order.customerName}</p>
                  <p className="text-gray-600">{order.customerAddress}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-gray-700">{order.customerPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <ul className="space-y-1 text-sm">
              {order.orderItems.map((item, index) => (
                <li key={index} className="text-gray-700">• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex justify-between items-center mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="text-gray-700">Order: ${order.orderValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">Fee: ${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">{order.distance}</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Est. Time: {order.estimatedTime}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {getOrderActions(order)}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
        <p className="text-gray-600">Manage your assigned deliveries and track progress</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="active">
            Active ({filterOrdersByStatus('active').length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            New ({filterOrdersByStatus('assigned').length})
          </TabsTrigger>
          <TabsTrigger value="in_transit">
            In Transit ({filterOrdersByStatus('in_transit').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterOrdersByStatus('completed').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({filterOrdersByStatus('cancelled').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <div className="space-y-4">
            {filterOrdersByStatus('active').map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {filterOrdersByStatus('active').length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
                <p className="text-gray-600">All your orders are completed. Great job!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assigned" className="mt-0">
          <div className="space-y-4">
            {filterOrdersByStatus('assigned').map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {filterOrdersByStatus('assigned').length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No New Orders</h3>
                <p className="text-gray-600">No new orders assigned at the moment.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="in_transit" className="mt-0">
          <div className="space-y-4">
            {filterOrdersByStatus('in_transit').map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {filterOrdersByStatus('in_transit').length === 0 && (
              <div className="text-center py-12">
                <Truck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders In Transit</h3>
                <p className="text-gray-600">No deliveries currently in progress.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="space-y-4">
            {filterOrdersByStatus('completed').map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {filterOrdersByStatus('completed').length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Orders</h3>
                <p className="text-gray-600">Completed orders will appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-0">
          <div className="space-y-4">
            {filterOrdersByStatus('cancelled').map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {filterOrdersByStatus('cancelled').length === 0 && (
              <div className="text-center py-12">
                <X className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Cancelled Orders</h3>
                <p className="text-gray-600">Cancelled orders will appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        order={cancelModalOrder}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
};

export default OrdersPage;