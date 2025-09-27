import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Building2, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  provinces,
  cities,
  districts,
  subDistricts,
  addressLabels,
} from "./data/mockDataAddress";

const AddressForm = ({ onSubmit, initialData, selectedLocation }) => {
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    province: "32", // Default to Jawa Barat (disabled)
    city: "",
    district: "",
    subDistrict: "",
    postalCode: "",
    streetAddress: "",
    label: "home",
  });

  const [availableCities, setAvailableCities] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubDistricts, setAvailableSubDistricts] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        recipientName: initialData.recipientName || "",
        recipientPhone: initialData.recipientPhone || "",
        province: initialData.province || "32",
        city: initialData.city || "",
        district: initialData.district || "",
        subDistrict: initialData.subDistrict || "",
        postalCode: initialData.postalCode || "",
        streetAddress: initialData.streetAddress || "",
        label: initialData.label || "home",
      });
    }
  }, [initialData]);

  useEffect(() => {
    // Load cities when province changes
    if (formData.province) {
      setAvailableCities(cities[formData.province] || []);
      setFormData((prev) => ({
        ...prev,
        city: "",
        district: "",
        subDistrict: "",
      }));
    }
  }, [formData.province]);

  useEffect(() => {
    // Load districts when city changes
    if (formData.city) {
      setAvailableDistricts(districts[formData.city] || []);
      setFormData((prev) => ({ ...prev, district: "", subDistrict: "" }));
    }
  }, [formData.city]);

  useEffect(() => {
    // Load sub-districts when district changes
    if (formData.district) {
      setAvailableSubDistricts(subDistricts[formData.district] || []);
      setFormData((prev) => ({ ...prev, subDistrict: "" }));
    }
  }, [formData.district]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Nama penerima harus diisi";
    }

    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = "Nomor telepon harus diisi";
    } else if (!/^(\+62|62|0)[0-9]{9,13}$/.test(formData.recipientPhone)) {
      newErrors.recipientPhone = "Format nomor telepon tidak valid";
    }

    if (!formData.city) {
      newErrors.city = "Kota/Kabupaten harus dipilih";
    }

    if (!formData.district) {
      newErrors.district = "Kecamatan harus dipilih";
    }

    if (!formData.subDistrict) {
      newErrors.subDistrict = "Kelurahan harus dipilih";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Kode pos harus diisi";
    } else if (!/^[0-9]{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = "Kode pos harus 5 digit angka";
    }

    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = "Alamat jalan harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get names for display
    const provinceData = provinces.find((p) => p.id === formData.province);
    const cityData = availableCities.find((c) => c.id === formData.city);
    const districtData = availableDistricts.find(
      (d) => d.id === formData.district
    );
    const subDistrictData = availableSubDistricts.find(
      (s) => s.id === formData.subDistrict
    );

    const addressWithNames = {
      ...formData,
      provinceName: provinceData?.name || "",
      cityName: cityData?.name || "",
      districtName: districtData?.name || "",
      subDistrictName: subDistrictData?.name || "",
    };

    onSubmit(addressWithNames);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getLabelInfo = (labelId) => {
    return (
      addressLabels.find((label) => label.id === labelId) || addressLabels[0]
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-4xl mx-auto"
    >
      <Card className="w-full md:w-[700px] lg:w-[900px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Label Alamat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {addressLabels.map((label) => (
              <Badge
                key={label.id}
                onClick={() => handleInputChange("label", label.id)}
                className={`cursor-pointer transition-all ${
                  formData.label === label.id
                    ? label.color + " ring-2 ring-offset-2 ring-slate-400"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recipient Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Informasi Penerima
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Nama Penerima *</Label>
              <Input
                id="recipientName"
                type="text"
                placeholder="Masukkan nama lengkap penerima"
                value={formData.recipientName}
                onChange={(e) =>
                  handleInputChange("recipientName", e.target.value)
                }
                className={errors.recipientName ? "border-red-500" : ""}
              />
              {errors.recipientName && (
                <p className="text-sm text-red-500">{errors.recipientName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Nomor Telepon *</Label>
              <Input
                id="recipientPhone"
                type="tel"
                placeholder="+62 atau 0812345678"
                value={formData.recipientPhone}
                onChange={(e) =>
                  handleInputChange("recipientPhone", e.target.value)
                }
                className={errors.recipientPhone ? "border-red-500" : ""}
              />
              {errors.recipientPhone && (
                <p className="text-sm text-red-500">{errors.recipientPhone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Informasi Alamat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Administrative Divisions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Province - Disabled */}
            <div className="space-y-2">
              <Label>Provinsi</Label>
              <Select value={formData.province} disabled>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="32">Jawa Barat</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Provinsi tidak dapat diubah
              </p>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>Kota/Kabupaten *</Label>
              <Select
                value={formData.city}
                onValueChange={(value) => handleInputChange("city", value)}
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
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label>Kecamatan *</Label>
              <Select
                value={formData.district}
                onValueChange={(value) => handleInputChange("district", value)}
                disabled={!formData.city}
              >
                <SelectTrigger
                  className={errors.district ? "border-red-500" : ""}
                >
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
              {errors.district && (
                <p className="text-sm text-red-500">{errors.district}</p>
              )}
            </div>

            {/* Sub District */}
            <div className="space-y-2">
              <Label>Kelurahan *</Label>
              <Select
                value={formData.subDistrict}
                onValueChange={(value) =>
                  handleInputChange("subDistrict", value)
                }
                disabled={!formData.district}
              >
                <SelectTrigger
                  className={errors.subDistrict ? "border-red-500" : ""}
                >
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
              {errors.subDistrict && (
                <p className="text-sm text-red-500">{errors.subDistrict}</p>
              )}
            </div>
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="postalCode">Kode Pos *</Label>
            <Input
              id="postalCode"
              type="text"
              placeholder="Contoh: 40154"
              maxLength={5}
              value={formData.postalCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                handleInputChange("postalCode", value);
              }}
              className={errors.postalCode ? "border-red-500" : ""}
            />
            {errors.postalCode && (
              <p className="text-sm text-red-500">{errors.postalCode}</p>
            )}
          </div>

          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Alamat Jalan *</Label>
            <Textarea
              id="streetAddress"
              placeholder="Contoh: Jl. Gempol Sari No. 123, RT 02/RW 05, Perumahan ABC, Patokan: Dekat Indomaret"
              rows={3}
              value={formData.streetAddress}
              onChange={(e) =>
                handleInputChange("streetAddress", e.target.value)
              }
              className={errors.streetAddress ? "border-red-500" : ""}
            />
            {errors.streetAddress && (
              <p className="text-sm text-red-500">{errors.streetAddress}</p>
            )}
            <p className="text-xs text-gray-500">
              Berikan detail lengkap termasuk nama jalan, nomor rumah, RT/RW,
              dan patokan yang mudah ditemukan
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selected Location Display */}
      {selectedLocation && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Koordinat Lokasi
                </h4>
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
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12"
        >
          <Save className="h-4 w-4 mr-2" />
          Simpan Alamat
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
