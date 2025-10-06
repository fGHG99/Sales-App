import React from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "../../ui/card";

const LocationDisplay = ({ selectedLocation }) => {
  if (!selectedLocation) return null;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Koordinat Lokasi</h4>
            <p className="text-blue-700 text-sm mb-2">
              {selectedLocation.address}
            </p>
            <div className="flex gap-4 text-xs text-blue-600">
              <span>Lat: {selectedLocation.lat.toFixed(6)}</span>
              <span>Lng: {selectedLocation.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationDisplay;
