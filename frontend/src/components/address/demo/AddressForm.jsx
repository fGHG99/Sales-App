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
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Function to get address from coordinates using Nominatim API
  const reverseGeocodeWithNominatim = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=id,en`
      );

      if (!response.ok) {
        throw new Error("Nominatim API request failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching address from Nominatim:", error);
      return null;
    }
  };

  // Enhanced function to parse Nominatim response and match with dropdown options
  const parseNominatimAddress = (nominatimData) => {
    try {
      const address = nominatimData.address || {};
      const displayName = nominatimData.display_name || "";

      let foundProvince = "";
      let foundCity = "";
      let foundDistrict = "";
      let foundSubDistrict = "";
      let extractedStreetAddress = "";
      let extractedPostalCode = "";

      // Extract postal code
      extractedPostalCode = address.postcode || "";

      // Try to match province from Nominatim data
      const stateOrProvince = address.state || address.province || "";
      if (stateOrProvince) {
        const matchedProvince = provinces.find(
          (p) =>
            p.name.toLowerCase().includes(stateOrProvince.toLowerCase()) ||
            stateOrProvince.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchedProvince) {
          foundProvince = matchedProvince.id;
        }
      }

      // Try to match city from Nominatim data
      const cityName =
        address.city ||
        address.town ||
        address.municipality ||
        address.county ||
        "";
      if (cityName && foundProvince) {
        const provinceCities = cities[foundProvince] || [];
        const matchedCity = provinceCities.find(
          (c) =>
            c.name.toLowerCase().includes(cityName.toLowerCase()) ||
            cityName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchedCity) {
          foundCity = matchedCity.id;
        }
      }

      // If no province found, search all cities
      if (!foundProvince && cityName) {
        for (const [provinceId, provinceCities] of Object.entries(cities)) {
          const matchedCity = provinceCities.find(
            (c) =>
              c.name.toLowerCase().includes(cityName.toLowerCase()) ||
              cityName.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matchedCity) {
            foundProvince = provinceId;
            foundCity = matchedCity.id;
            break;
          }
        }
      }

      // Try to match district
      const districtName =
        address.suburb || address.neighbourhood || address.village || "";
      if (districtName && foundCity) {
        const cityDistricts = districts[foundCity] || [];
        const matchedDistrict = cityDistricts.find(
          (d) =>
            d.name.toLowerCase().includes(districtName.toLowerCase()) ||
            districtName.toLowerCase().includes(d.name.toLowerCase())
        );
        if (matchedDistrict) {
          foundDistrict = matchedDistrict.id;
        }
      }

      // Try to match sub-district
      if (foundDistrict) {
        const districtSubDistricts = subDistricts[foundDistrict] || [];
        const matchedSubDistrict = districtSubDistricts.find(
          (sd) =>
            displayName.toLowerCase().includes(sd.name.toLowerCase()) ||
            (address.hamlet &&
              address.hamlet.toLowerCase().includes(sd.name.toLowerCase()))
        );
        if (matchedSubDistrict) {
          foundSubDistrict = matchedSubDistrict.id;
        }
      }

      // Build street address from components
      const streetParts = [];
      if (address.house_number && address.road) {
        streetParts.push(`${address.road} No. ${address.house_number}`);
      } else if (address.road) {
        streetParts.push(address.road);
      }

      if (address.hamlet && address.hamlet !== districtName) {
        streetParts.push(address.hamlet);
      }

      extractedStreetAddress =
        streetParts.join(", ") || displayName.split(",")[0] || "";

      console.log("Nominatim data:", nominatimData);
      console.log("Parsed address:", {
        province: foundProvince,
        city: foundCity,
        district: foundDistrict,
        subDistrict: foundSubDistrict,
        postalCode: extractedPostalCode,
        streetAddress: extractedStreetAddress,
      });

      return {
        province: foundProvince,
        city: foundCity,
        district: foundDistrict,
        subDistrict: foundSubDistrict,
        postalCode: extractedPostalCode,
        streetAddress: extractedStreetAddress,
      };
    } catch (error) {
      console.error("Error parsing Nominatim address:", error);
      return null;
    }
  };

  // Parse address from selectedLocation when it changes using Nominatim API
  useEffect(() => {
    const parseLocationAddress = async () => {
      if (selectedLocation?.lat && selectedLocation?.lng && !initialData) {
        setIsLoadingAddress(true);
        try {
          // Use Nominatim API for reverse geocoding
          const nominatimData = await reverseGeocodeWithNominatim(
            selectedLocation.lat,
            selectedLocation.lng
          );

          if (nominatimData) {
            const parsedAddress = parseNominatimAddress(nominatimData);

            if (parsedAddress) {
              // Update form with parsed data
              setFormData((prev) => ({
                ...prev,
                province: parsedAddress.province || "32", // Fallback to Jawa Barat
                city: parsedAddress.city || "",
                district: parsedAddress.district || "",
                subDistrict: parsedAddress.subDistrict || "",
                postalCode: parsedAddress.postalCode || "",
                streetAddress: parsedAddress.streetAddress || "",
              }));

              // Load cascading dropdowns
              if (parsedAddress.province) {
                setAvailableCities(cities[parsedAddress.province] || []);
              }
              if (parsedAddress.city) {
                setAvailableDistricts(districts[parsedAddress.city] || []);
              }
              if (parsedAddress.district) {
                setAvailableSubDistricts(
                  subDistricts[parsedAddress.district] || []
                );
              }
            }
          } else {
            // Fallback to simple string parsing if Nominatim fails
            parseAddressFromLocation(selectedLocation.address);
          }
        } catch (error) {
          console.error("Error processing location with Nominatim:", error);
          // Fallback to simple string parsing
          if (selectedLocation.address) {
            parseAddressFromLocation(selectedLocation.address);
          }
        } finally {
          setIsLoadingAddress(false);
        }
      }
    };

    parseLocationAddress();
  }, [selectedLocation]);

  // Function to parse address and auto-fill form
  const parseAddressFromLocation = async (addressString) => {
    try {
      // Split address by comma and clean up
      const parts = addressString.split(",").map((s) => s.trim());

      // Try to find matching data in our mock data
      let foundProvince = null;
      let foundCity = null;
      let foundDistrict = null;
      let foundSubDistrict = null;
      let foundPostalCode = "";
      let foundStreet = "";

      // Search for province (looking for "Jawa Barat" or similar)
      foundProvince = provinces.find((p) =>
        addressString.toLowerCase().includes(p.name.toLowerCase())
      );

      if (foundProvince) {
        const provinceCities = cities[foundProvince.id] || [];

        // Search for city
        foundCity = provinceCities.find((c) =>
          addressString.toLowerCase().includes(c.name.toLowerCase())
        );

        if (foundCity) {
          const cityDistricts = districts[foundCity.id] || [];

          // Search for district
          foundDistrict = cityDistricts.find((d) =>
            addressString.toLowerCase().includes(d.name.toLowerCase())
          );

          if (foundDistrict) {
            const districtSubDistricts = subDistricts[foundDistrict.id] || [];

            // Search for sub-district
            foundSubDistrict = districtSubDistricts.find((sd) =>
              addressString.toLowerCase().includes(sd.name.toLowerCase())
            );
          }
        }
      }

      // Extract postal code (5 digits)
      const postalCodeMatch = addressString.match(/\b\d{5}\b/);
      if (postalCodeMatch) {
        foundPostalCode = postalCodeMatch[0];
      }

      // Extract street address (first part before first comma, or use full if can't parse)
      foundStreet = parts[0] || "";

      // Update form with found data
      setFormData((prev) => ({
        ...prev,
        province: foundProvince?.id || "32",
        city: foundCity?.id || "",
        district: foundDistrict?.id || "",
        subDistrict: foundSubDistrict?.id || "",
        postalCode: foundPostalCode,
        streetAddress: foundStreet,
      }));

      // Load cascading dropdowns
      if (foundProvince) {
        setAvailableCities(cities[foundProvince.id] || []);
      }
      if (foundCity) {
        setAvailableDistricts(districts[foundCity.id] || []);
      }
      if (foundDistrict) {
        setAvailableSubDistricts(subDistricts[foundDistrict.id] || []);
      }
    } catch (error) {
      console.error("Error parsing address:", error);
    }
  };

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

      // Load cascading dropdowns for initialData
      if (initialData.province) {
        setAvailableCities(cities[initialData.province] || []);
      }
      if (initialData.city) {
        setAvailableDistricts(districts[initialData.city] || []);
      }
      if (initialData.district) {
        setAvailableSubDistricts(subDistricts[initialData.district] || []);
      }
    }
  }, [initialData]);

  useEffect(() => {
    // Load cities when province changes
    if (formData.province) {
      const provinceCities = cities[formData.province] || [];
      setAvailableCities(provinceCities);

      // Only clear dependent fields if city is not in the new province's cities
      const cityExists = provinceCities.some((c) => c.id === formData.city);
      if (!cityExists && !initialData) {
        setFormData((prev) => ({
          ...prev,
          city: "",
          district: "",
          subDistrict: "",
        }));
      }
    }
  }, [formData.province]);

  useEffect(() => {
    // Load districts when city changes
    if (formData.city) {
      const cityDistricts = districts[formData.city] || [];
      setAvailableDistricts(cityDistricts);

      // Only clear dependent fields if district is not in the new city's districts
      const districtExists = cityDistricts.some(
        (d) => d.id === formData.district
      );
      if (!districtExists && !initialData) {
        setFormData((prev) => ({
          ...prev,
          district: "",
          subDistrict: "",
        }));
      }
    }
  }, [formData.city]);

  useEffect(() => {
    // Load sub-districts when district changes
    if (formData.district) {
      const districtSubs = subDistricts[formData.district] || [];
      setAvailableSubDistricts(districtSubs);

      // Only clear sub-district if it's not in the new district's sub-districts
      const subDistrictExists = districtSubs.some(
        (sd) => sd.id === formData.subDistrict
      );
      if (!subDistrictExists && !initialData) {
        setFormData((prev) => ({
          ...prev,
          subDistrict: "",
        }));
      }
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

    if (!formData.province) {
      newErrors.province = "Provinsi harus dipilih";
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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
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
          {selectedLocation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              {isLoadingAddress ? (
                <p className="text-sm text-blue-800">
                  � Sedang menganalisis alamat dari koordinat yang dipilih...
                </p>
              ) : (
                <p className="text-sm text-blue-800">
                  �📍 Data alamat telah diisi otomatis dari lokasi yang dipilih
                  menggunakan API Nominatim. Anda dapat mengedit dropdown di
                  bawah jika ada yang tidak sesuai.
                </p>
              )}
            </div>
          )}

          {/* Administrative Divisions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Province - Now editable */}
            <div className="space-y-2">
              <Label>Provinsi *</Label>
              <Select
                value={formData.province}
                onValueChange={(value) => handleInputChange("province", value)}
              >
                <SelectTrigger
                  className={errors.province ? "border-red-500" : ""}
                >
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

            {/* City - Editable */}
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
              {selectedLocation && formData.city && (
                <p className="text-xs text-green-600">
                  Auto-filled dari koordinat peta
                </p>
              )}
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            {/* District - Editable */}
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
              {selectedLocation && formData.district && (
                <p className="text-xs text-green-600">
                  Auto-filled dari koordinat peta
                </p>
              )}
              {errors.district && (
                <p className="text-sm text-red-500">{errors.district}</p>
              )}
            </div>

            {/* Sub District - Editable */}
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
                const value = e.target.value.replace(/\D/g, "");
                handleInputChange("postalCode", value);
              }}
              className={errors.postalCode ? "border-red-500" : ""}
            />
            {selectedLocation && formData.postalCode && (
              <p className="text-xs text-green-600">
                Auto-filled dari koordinat peta
              </p>
            )}
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
            {selectedLocation && formData.streetAddress && (
              <p className="text-xs text-green-600">
                Auto-filled dari koordinat peta
              </p>
            )}
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
