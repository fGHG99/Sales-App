import React from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import LocationDropdowns from "./LocationDropdowns";
import PostalCodeInput from "./PostalCodeInput";
import StreetAddressInput from "./StreetAddressInput";

const AddressInfoCard = ({
  formData,
  errors,
  provinces,
  availableCities,
  availableDistricts,
  availableSubDistricts,
  onInputChange,
  selectedLocation,
}) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Informasi Alamat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Administrative Divisions */}
        <LocationDropdowns
          formData={formData}
          errors={errors}
          provinces={provinces}
          availableCities={availableCities}
          availableDistricts={availableDistricts}
          availableSubDistricts={availableSubDistricts}
          onInputChange={onInputChange}
          selectedLocation={selectedLocation}
        />

        {/* Postal Code */}
        <PostalCodeInput
          value={formData.postalCode}
          error={errors.postalCode}
          onChange={(value) => onInputChange("postalCode", value)}
          selectedLocation={selectedLocation}
        />

        {/* Street Address */}
        <StreetAddressInput
          value={formData.streetAddress}
          error={errors.streetAddress}
          onChange={(e) => onInputChange("streetAddress", e.target.value)}
          selectedLocation={selectedLocation}
        />
      </CardContent>
    </Card>
  );
};

export default AddressInfoCard;
