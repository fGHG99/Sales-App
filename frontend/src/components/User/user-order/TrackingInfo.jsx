import React from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { MapPin, Clock, RefreshCw } from 'lucide-react';

// This component contains the tracking elements that should be rendered internally 
// but not displayed in the frontend UI as per requirements
const TrackingInfo = ({ 
  estimatedArrival, 
  liveTrackingActive, 
  lastUpdated, 
  deliveryStatus 
}) => {
  return (
    <div className="space-y-4" style={{ display: 'none' }}>
      {/* Hidden elements that can be reused later */}
      
      {/* Estimated Arrival (removed from UI but kept internal) */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm text-gray-600">Estimated Arrival</p>
            <p className="font-semibold">{estimatedArrival}</p>
          </div>
        </div>
      </Card>

      {/* Live Tracking Status (removed from UI but kept internal) */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <RefreshCw className={`w-5 h-5 ${liveTrackingActive ? 'text-green-500 animate-spin' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm text-gray-600">Live Tracking</p>
            <Badge variant={liveTrackingActive ? "success" : "secondary"}>
              {liveTrackingActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Last Updated (removed from UI but kept internal) */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Updated At</p>
            <p className="font-medium text-sm">{lastUpdated}</p>
          </div>
        </div>
      </Card>

      {/* Delivery Status (removed from UI but kept internal) */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <Badge variant="outline">{deliveryStatus}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrackingInfo;