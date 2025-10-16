import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import LocationDisplay from "./LocationDisplay";
import { useAddressData } from "../hooks/useAddressData";
import { useAddressValidation } from "../hooks/useAddressValidation";

/**
 * AddressFormCompact Component
 *
 * Form alamat dengan layout compact seperti pada gambar
 * Menggunakan layout 2 kolom untuk beberapa field
 */
const AddressFormCompact = ({
  onSubmit,
  initialData,
  selectedLocation,
  isSubmitting,
  onEditLocation,
}) => {
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    province: "",
    provinceId: "",
    city: "",
    cityId: "",
    district: "",
    districtId: "",
    subDistrict: "",
    subDistrictId: "",
    postalCode: "",
    streetAddress: "",
    label: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Use custom hooks
  const {
    provinces,
    availableCities,
    availableDistricts,
    availableSubDistricts,
  } = useAddressData(formData);

  const { validateForm } = useAddressValidation();

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        recipientName: initialData.recipientName || "",
        recipientPhone: initialData.recipientPhone || "",
        province: initialData.province || "",
        provinceId: initialData.provinceId || "",
        city: initialData.city || "",
        cityId: initialData.cityId || "",
        district: initialData.district || "",
        districtId: initialData.districtId || "",
        subDistrict: initialData.subDistrict || "",
        subDistrictId: initialData.subDistrictId || "",
        postalCode: initialData.postalCode || "",
        streetAddress: initialData.streetAddress || "",
        label: initialData.label || "",
      });
    }
  }, [initialData]);

  // Helper function to find ID by name
  const findIdByName = (items, name) => {
    if (!name || !items) return "";
    return (
      items.find((item) => item.name.toLowerCase() === name.toLowerCase())
        ?.id || ""
    );
  };

  // Parse address from selectedLocation when it changes
  useEffect(() => {
    const parseLocationAddress = async () => {
      if (selectedLocation?.lat && selectedLocation?.lng && !initialData) {
        console.log("Parsing location address:", selectedLocation.address);
        console.log("Available provinces:", provinces);

        setIsLoadingAddress(true);
        try {
          // Parse address components from selectedLocation.address
          const addressParts = selectedLocation.address
            .split(",")
            .map((part) => part.trim());

          console.log("Address parts:", addressParts);

          // Indonesian address format: Street, Sub-district, District, City, Province, Postal Code
          // Example: "Jl. Raya Bojongsoang No. 98, Bojongsoang, Bojongsoang, Bandung, Jawa Barat, 40288"
          let parsedData = {
            streetAddress: addressParts[0] || "",
            province: "",
            provinceId: "",
            city: "",
            cityId: "",
            district: "",
            districtId: "",
            subDistrict: "",
            subDistrictId: "",
            postalCode: "",
          };

          if (addressParts.length >= 5) {
            // Reverse order: Province, City, District, Sub-district, Street
            parsedData.province = addressParts[addressParts.length - 2] || "";
            parsedData.city = addressParts[addressParts.length - 3] || "";
            parsedData.district = addressParts[addressParts.length - 4] || "";
            parsedData.subDistrict =
              addressParts[addressParts.length - 5] || "";

            // Check if last part is postal code (numeric)
            const lastPart = addressParts[addressParts.length - 1];
            if (/^\d{5}$/.test(lastPart)) {
              parsedData.postalCode = lastPart;
            }

            console.log("Parsed data:", parsedData);

            // Find IDs for the parsed names - but only if provinces are loaded
            if (provinces && provinces.length > 0) {
              parsedData.provinceId = findIdByName(
                provinces,
                parsedData.province
              );
              console.log("Found province ID:", parsedData.provinceId);
            }
          }

          // Update form data with parsed address
          setFormData((prev) => {
            console.log("Updating form data with:", parsedData);
            return {
              ...prev,
              ...parsedData,
            };
          });
        } catch (error) {
          console.error("Error parsing location address:", error);
        } finally {
          setIsLoadingAddress(false);
        }
      }
    };

    parseLocationAddress();
  }, [selectedLocation, initialData]);

  // Separate useEffect to handle ID matching when data is available
  useEffect(() => {
    if (
      formData.province &&
      provinces &&
      provinces.length > 0 &&
      !formData.provinceId
    ) {
      console.log(
        "Matching province:",
        formData.province,
        "with provinces:",
        provinces
      );
      const provinceId = findIdByName(provinces, formData.province);
      console.log("Found province ID:", provinceId);
      if (provinceId) {
        setFormData((prev) => ({
          ...prev,
          provinceId: provinceId,
        }));
      }
    }
  }, [formData.province, provinces, formData.provinceId]);

  // Update city, district, subDistrict when provinceId changes
  useEffect(() => {
    if (formData.provinceId && availableCities.length > 0) {
      console.log(
        "Looking for city:",
        formData.city,
        "in cities:",
        availableCities
      );
      const cityId = findIdByName(availableCities, formData.city);
      console.log("Found city ID:", cityId);
      if (cityId) {
        setFormData((prev) => ({
          ...prev,
          cityId: cityId,
        }));
      }
    }
  }, [formData.provinceId, availableCities, formData.city]);

  // Update district, subDistrict when cityId changes
  useEffect(() => {
    if (formData.cityId && availableDistricts.length > 0) {
      console.log(
        "Looking for district:",
        formData.district,
        "in districts:",
        availableDistricts
      );
      const districtId = findIdByName(availableDistricts, formData.district);
      console.log("Found district ID:", districtId);
      if (districtId) {
        setFormData((prev) => ({
          ...prev,
          districtId: districtId,
        }));
      }
    }
  }, [formData.cityId, availableDistricts, formData.district]);

  // Update subDistrict when districtId changes
  useEffect(() => {
    if (formData.districtId && availableSubDistricts.length > 0) {
      console.log(
        "Looking for subDistrict:",
        formData.subDistrict,
        "in subDistricts:",
        availableSubDistricts
      );
      const subDistrictId = findIdByName(
        availableSubDistricts,
        formData.subDistrict
      );
      console.log("Found subDistrict ID:", subDistrictId);
      if (subDistrictId) {
        setFormData((prev) => ({
          ...prev,
          subDistrictId: subDistrictId,
        }));
      }
    }
  }, [formData.districtId, availableSubDistricts, formData.subDistrict]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData, selectedLocation);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      fullAddress: selectedLocation?.address || formData.streetAddress,
      coordinates: {
        lat: selectedLocation?.lat || 0,
        lng: selectedLocation?.lng || 0,
      },
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Label Alamat */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Label Alamat
        </label>
        <Input
          type="text"
          value={formData.label}
          onChange={(e) => handleInputChange("label", e.target.value)}
          placeholder="Contoh: Rumah, apartmen, atau kantor"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Contoh: Rumah, apartmen, atau kantor
        </p>
        {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
      </div>

      {/* Titik Lokasi */}
      <LocationDisplay
        selectedLocation={selectedLocation}
        onEditLocation={onEditLocation}
      />

      {/* Alamat Lengkap */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Alamat Lengkap
        </label>
        <Input
          type="text"
          value={formData.streetAddress}
          onChange={(e) => handleInputChange("streetAddress", e.target.value)}
          placeholder="Masukkan alamat lengkap"
          className="w-full"
        />
        {errors.streetAddress && (
          <p className="text-xs text-red-500">{errors.streetAddress}</p>
        )}
      </div>

      {/* Provinsi */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Provinsi</label>
        <Select
          value={formData.provinceId}
          onValueChange={(value) => {
            const province = provinces.find((p) => p.id === value);
            handleInputChange("provinceId", value);
            handleInputChange("province", province?.name || "");
            // Reset dependent fields
            handleInputChange("cityId", "");
            handleInputChange("city", "");
            handleInputChange("districtId", "");
            handleInputChange("district", "");
            handleInputChange("subDistrictId", "");
            handleInputChange("subDistrict", "");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Provinsi" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.province && (
          <p className="text-xs text-red-500">{errors.province}</p>
        )}
      </div>

      {/* Kota dan Kecamatan - 2 kolom */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Kota</label>
          <Select
            value={formData.cityId}
            onValueChange={(value) => {
              const city = availableCities.find((c) => c.id === value);
              handleInputChange("cityId", value);
              handleInputChange("city", city?.name || "");
              // Reset dependent fields
              handleInputChange("districtId", "");
              handleInputChange("district", "");
              handleInputChange("subDistrictId", "");
              handleInputChange("subDistrict", "");
            }}
            disabled={!formData.provinceId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Kota" />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Kecamatan</label>
          <Select
            value={formData.districtId}
            onValueChange={(value) => {
              const district = availableDistricts.find((d) => d.id === value);
              handleInputChange("districtId", value);
              handleInputChange("district", district?.name || "");
              // Reset dependent fields
              handleInputChange("subDistrictId", "");
              handleInputChange("subDistrict", "");
            }}
            disabled={!formData.cityId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Kecamatan" />
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
            <p className="text-xs text-red-500">{errors.district}</p>
          )}
        </div>
      </div>

      {/* Kelurahan dan Kode Pos - 2 kolom */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Kelurahan</label>
          <Select
            value={formData.subDistrictId}
            onValueChange={(value) => {
              const subDistrict = availableSubDistricts.find(
                (s) => s.id === value
              );
              handleInputChange("subDistrictId", value);
              handleInputChange("subDistrict", subDistrict?.name || "");
            }}
            disabled={!formData.districtId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Kelurahan" />
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
            <p className="text-xs text-red-500">{errors.subDistrict}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Kode Pos</label>
          <Input
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleInputChange("postalCode", e.target.value)}
            placeholder="Masukkan kode pos"
            className="w-full"
          />
          {errors.postalCode && (
            <p className="text-xs text-red-500">{errors.postalCode}</p>
          )}
        </div>
      </div>

      {/* Nama Penerima dan Nomor Handphone - 2 kolom */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nama Penerima
          </label>
          <Input
            type="text"
            value={formData.recipientName}
            onChange={(e) => handleInputChange("recipientName", e.target.value)}
            placeholder="Masukkan nama penerima"
            className="w-full"
          />
          {errors.recipientName && (
            <p className="text-xs text-red-500">{errors.recipientName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nomor Handphone
          </label>
          <Input
            type="tel"
            value={formData.recipientPhone}
            onChange={(e) =>
              handleInputChange("recipientPhone", e.target.value)
            }
            placeholder="Masukkan nomor handphone"
            className="w-full"
          />
          {errors.recipientPhone && (
            <p className="text-xs text-red-500">{errors.recipientPhone}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {initialData ? "Ubah Alamat" : "Simpan Alamat"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddressFormCompact;
