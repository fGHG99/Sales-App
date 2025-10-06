import React from "react";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

const LocationDropdowns = ({
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Province */}
      <div className="space-y-2">
        <Label>Provinsi *</Label>
        <Select
          value={formData.provinceId}
          onValueChange={(value) => onInputChange("province", value)}
        >
          <SelectTrigger className={errors.province ? "border-red-500" : ""}>
            <SelectValue placeholder="Pilih provinsi" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLocation && (
          <p className="text-xs text-green-600">
            Auto-filled dari koordinat peta
          </p>
        )}
        {errors.province && (
          <p className="text-sm text-red-500">{errors.province}</p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label>Kota/Kabupaten *</Label>
        <Select
          value={formData.cityId}
          onValueChange={(value) => onInputChange("city", value)}
        >
          <SelectTrigger className={errors.city ? "border-red-500" : ""}>
            <SelectValue placeholder="Pilih kota/kabupaten" />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLocation && formData.city && (
          <p className="text-xs text-green-600">
            Auto-filled dari koordinat peta
          </p>
        )}
        {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
      </div>

      {/* District */}
      <div className="space-y-2">
        <Label>Kecamatan *</Label>
        <Select
          value={formData.districtId}
          onValueChange={(value) => onInputChange("district", value)}
          disabled={!formData.cityId}
        >
          <SelectTrigger className={errors.district ? "border-red-500" : ""}>
            <SelectValue placeholder="Pilih kecamatan" />
          </SelectTrigger>
          <SelectContent>
            {availableDistricts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLocation && formData.district && (
          <p className="text-xs text-green-600">
            Auto-filled dari koordinat peta
          </p>
        )}
        {errors.district && (
          <p className="text-sm text-red-500">{errors.district}</p>
        )}
      </div>

      {/* Sub District */}
      <div className="space-y-2">
        <Label>Kelurahan *</Label>
        <Select
          value={formData.subDistrictId}
          onValueChange={(value) => onInputChange("subDistrict", value)}
          disabled={!formData.districtId}
        >
          <SelectTrigger className={errors.subDistrict ? "border-red-500" : ""}>
            <SelectValue placeholder="Pilih kelurahan" />
          </SelectTrigger>
          <SelectContent>
            {availableSubDistricts.map((subDistrict) => (
              <SelectItem key={subDistrict.id} value={subDistrict.id}>
                {subDistrict.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLocation && formData.subDistrict && (
          <p className="text-xs text-green-600">
            Auto-filled dari koordinat peta
          </p>
        )}
        {errors.subDistrict && (
          <p className="text-sm text-red-500">{errors.subDistrict}</p>
        )}
      </div>
    </div>
  );
};

export default LocationDropdowns;
