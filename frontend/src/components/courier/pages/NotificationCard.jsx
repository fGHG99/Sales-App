import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  AlertCircle, 
  Clock, 
  MessageSquare,
  ChevronRight 
} from 'lucide-react';
import { getOrderById } from '../../../utils/mockDataCourier';

const NotificationCard = ({ notification, onClick }) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    const iconMap = {
      'new_order': Package,
      'order_update': AlertCircle,
      'system': Clock,
      'customer_update': MessageSquare
    };
    return iconMap[type] || AlertCircle;
  };

  const getNotificationColor = (type) => {
    if (!notification.read) {
      if (type === 'new_order') {
        return 'bg-blue-50 border-l-blue-500 hover:bg-blue-100';
      }
    }
    return 'bg-gray-50 border-l-gray-300 hover:bg-gray-100';
  };

  const handleNotificationClick = () => {
    if (notification.orderId) {
      const order = getOrderById(notification.orderId);
      if (order) {
        navigate('/courier/orders');
      }
    }
    if (onClick) onClick();
  };

  const Icon = getNotificationIcon(notification.type);

  return (
    <div 
      className={`p-3 border-l-4 cursor-pointer transition-colors ${getNotificationColor(notification.type)}`}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-1.5 rounded-full ${
            notification.read ? 'bg-gray-200' : 'bg-blue-100'
          }`}>
            <Icon className={`h-4 w-4 ${
              notification.read ? 'text-gray-600' : 'text-blue-600'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`font-medium text-sm ${
                notification.read ? 'text-gray-700' : 'text-gray-900'
              }`}>
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {new Date(notification.timestamp).toLocaleTimeString([], {
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </span>
              
              {notification.orderId && (
                <div className="flex items-center text-blue-600 hover:text-blue-800">
                  <span className="text-xs font-medium">View Order</span>
                  <ChevronRight className="h-3 w-3 ml-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;