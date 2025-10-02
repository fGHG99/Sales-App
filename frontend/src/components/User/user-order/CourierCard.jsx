import React from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';

const CourierCard = ({ courierInfo, estimatedArrival, onWhatsAppClick }) => {
  const handleWhatsAppClick = () => {
    const phoneNumber = courierInfo.phoneNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent('Hi! I wanted to check on my delivery status.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    if (onWhatsAppClick) {
      onWhatsAppClick(whatsappUrl);
    } else {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <Card className="p-6 bg-white border shadow-lg">
      <div className="flex items-center space-x-4">
        {/* Courier Avatar */}
        <Avatar className="w-16 h-16">
          <AvatarImage 
            src={courierInfo.profilePicture} 
            alt={courierInfo.name}
          />
          <AvatarFallback className="bg-blue-500 text-white text-lg">
            {courierInfo.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>

        {/* Courier Information */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {courierInfo.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            {courierInfo.vehicleLicensePlate}
          </p>
          
          {/* ETA */}
          <div className="flex items-center mt-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 mr-1 text-blue-500" />
            <span>ETA: <span className="font-medium text-blue-600">{estimatedArrival}</span></span>
          </div>
        </div>

        {/* WhatsApp Button */}
        <Button
          onClick={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
      </div>
    </Card>
  );
};

export default CourierCard;