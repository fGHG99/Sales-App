import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "../../ui/button";
import AddressLabelInput from "../components/AddressLabelInput";
import RecipientInfoCard from "../components/RecipientInfoCard";
import AddressInfoCard from "../components/AddressInfoCard";
import LocationDisplay from "../components/LocationDisplay";
import { useAddressData } from "../hooks/useAddressData";
import { useAddressValidation } from "../hooks/useAddressValidation";

const AddressForm = ({
  onSubmit,
  initialData,
  selectedLocation,
  isSubmitting,
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

  // Parse address from selectedLocation when it changes
  useEffect(() => {
    const parseLocationAddress = async () => {
      if (selectedLocation?.lat && selectedLocation?.lng && !initialData) {
        setIsLoadingAddress(true);
        try {
          // Check if selectedLocation has address data directly
          if (selectedLocation.addressData) {
            const addrData = selectedLocation.addressData;

            // Extract values from the new structure
            const provinceName = addrData.state || "";
            const cityName = addrData.city || "";
            const districtName = addrData.subdistrict || "";
            const subDistrictName = addrData.village || "";
            const postalCode = addrData.postcode || "";

            console.log("Parsing address data:", {
              provinceName,
              cityName,
              districtName,
              subDistrictName,
              postalCode,
            });

            // Update form with parsed data
            setFormData((prev) => ({
              ...prev,
              province: provinceName,
              provinceId: "", // Will be set by helper useEffect
              city: cityName,
              cityId: "", // Will be set by helper useEffect
              district: districtName,
              districtId: "", // Will be set by helper useEffect
              subDistrict: subDistrictName,
              subDistrictId: "", // Will be set by helper useEffect
              postalCode: postalCode,
              streetAddress: "", // Leave empty for manual input
            }));
          } else {
            // Fallback: try to parse from address string if no addressData
            console.log("No addressData, using address string");
            if (selectedLocation.address) {
              parseAddressFromString(selectedLocation.address);
            }
          }
        } catch (error) {
          console.error("Error processing location:", error);
        } finally {
          setIsLoadingAddress(false);
        }
      }
    };

    parseLocationAddress();
  }, [selectedLocation, initialData]);

  // Function to parse address string as fallback
  const parseAddressFromString = (addressString) => {
    try {
      // This is a simple fallback parser
      // Extract postal code (5 digits)
      const postalCodeMatch = addressString.match(/\b\d{5}\b/);
      const foundPostalCode = postalCodeMatch ? postalCodeMatch[0] : "";

      // Try to extract province, city, etc. from the string
      const parts = addressString.split(",").map((s) => s.trim());

      // Common patterns: "Street, Village, District, City, Province PostalCode"
      let provinceName = "";
      let cityName = "";

      // Look for province name in our list
      const foundProvince = provinces.find((p) =>
        addressString.toLowerCase().includes(p.name.toLowerCase())
      );

      if (foundProvince) {
        provinceName = foundProvince.name;
      }

      console.log("Parsed from string:", { provinceName, foundPostalCode });

      // Update form with found data
      setFormData((prev) => ({
        ...prev,
        province: provinceName,
        provinceId: "",
        postalCode: foundPostalCode,
        streetAddress: "", // Leave empty for manual input
      }));
    } catch (error) {
      console.error("Error parsing address string:", error);
    }
  };

  useEffect(() => {
    if (initialData) {
      // Only autofill: recipientName, recipientPhone, label, province, city, and postalCode
      // Leave empty: district, subDistrict, streetAddress (for manual input)
      setFormData((prev) => ({
        ...prev,
        recipientName: initialData.recipientName || "",
        recipientPhone: initialData.recipientPhone || "",
        province: initialData.province || "",
        provinceId: initialData.provinceId || "",
        city: initialData.city || "",
        cityId: initialData.cityId || "",
        postalCode: initialData.postalCode || "",
        label: initialData.label || "",
        // These fields are left empty for manual input
        district: "",
        districtId: "",
        subDistrict: "",
        subDistrictId: "",
        streetAddress: "",
      }));

      // Trigger API calls to populate city dropdown when province is set
      // The useEffect hooks will automatically fetch cities when provinceId or province name changes
      // and districts when cityId or city name changes
    }
  }, [initialData]);

  // Helper effect to find and set IDs when we have names but not IDs
  useEffect(() => {
    if (formData.province && !formData.provinceId && provinces.length > 0) {
      const matchedProvince = provinces.find(
        (p) => p.name.toLowerCase() === formData.province.toLowerCase()
      );
      if (matchedProvince) {
        setFormData((prev) => ({
          ...prev,
          provinceId: matchedProvince.id,
        }));
      }
    }
  }, [formData.province, formData.provinceId, provinces]);

  useEffect(() => {
    if (formData.city && !formData.cityId && availableCities.length > 0) {
      const matchedCity = availableCities.find(
        (c) => c.name.toLowerCase() === formData.city.toLowerCase()
      );
      if (matchedCity) {
        setFormData((prev) => ({
          ...prev,
          cityId: matchedCity.id,
        }));
      }
    }
  }, [formData.city, formData.cityId, availableCities]);

  useEffect(() => {
    if (
      formData.district &&
      !formData.districtId &&
      availableDistricts.length > 0
    ) {
      const matchedDistrict = availableDistricts.find(
        (d) => d.name.toLowerCase() === formData.district.toLowerCase()
      );
      if (matchedDistrict) {
        setFormData((prev) => ({
          ...prev,
          districtId: matchedDistrict.id,
        }));
      }
    }
  }, [formData.district, formData.districtId, availableDistricts]);

  useEffect(() => {
    if (
      formData.subDistrict &&
      !formData.subDistrictId &&
      availableSubDistricts.length > 0
    ) {
      const matchedSubDistrict = availableSubDistricts.find(
        (sd) => sd.name.toLowerCase() === formData.subDistrict.toLowerCase()
      );
      if (matchedSubDistrict) {
        setFormData((prev) => ({
          ...prev,
          subDistrictId: matchedSubDistrict.id,
        }));
      }
    }
  }, [formData.subDistrict, formData.subDistrictId, availableSubDistricts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm(formData);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build fullAddress from form data
    const fullAddress = `${formData.streetAddress}, ${formData.subDistrict}, ${formData.district}, ${formData.city}, ${formData.province} ${formData.postalCode}`;

    // Prepare data for submission with coordinates if available
    const addressData = {
      ...formData,
      fullAddress,
      coordinates: selectedLocation
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : null,
    };

    // Call the onSubmit callback passed from parent
    onSubmit(addressData);
  };

  const handleInputChange = (field, value) => {
    // Handle location dropdowns specially
    if (field === "province") {
      const selectedProvince = provinces.find((p) => p.id === value);
      setFormData((prev) => ({
        ...prev,
        province: selectedProvince?.name || "",
        provinceId: value,
        city: "",
        cityId: "",
        district: "",
        districtId: "",
        subDistrict: "",
        subDistrictId: "",
      }));
    } else if (field === "city") {
      const selectedCity = availableCities.find((c) => c.id === value);
      setFormData((prev) => ({
        ...prev,
        city: selectedCity?.name || "",
        cityId: value,
        district: "",
        districtId: "",
        subDistrict: "",
        subDistrictId: "",
      }));
    } else if (field === "district") {
      const selectedDistrict = availableDistricts.find((d) => d.id === value);
      setFormData((prev) => ({
        ...prev,
        district: selectedDistrict?.name || "",
        districtId: value,
        subDistrict: "",
        subDistrictId: "",
      }));
    } else if (field === "subDistrict") {
      const selectedSubDistrict = availableSubDistricts.find(
        (s) => s.id === value
      );
      setFormData((prev) => ({
        ...prev,
        subDistrict: selectedSubDistrict?.name || "",
        subDistrictId: value,
      }));
    } else {
      // Handle all other fields normally
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-4xl mx-auto"
    >
      {/* Address Label */}
      <AddressLabelInput
        value={formData.label}
        onChange={(e) => handleInputChange("label", e.target.value)}
        error={errors.label}
      />

      {/* Recipient Information */}
      <RecipientInfoCard
        formData={formData}
        errors={errors}
        onInputChange={handleInputChange}
      />

      {/* Address Information */}
      <AddressInfoCard
        formData={formData}
        errors={errors}
        provinces={provinces}
        availableCities={availableCities}
        availableDistricts={availableDistricts}
        availableSubDistricts={availableSubDistricts}
        onInputChange={handleInputChange}
        selectedLocation={selectedLocation}
      />

      {/* Selected Location Display */}
      <LocationDisplay selectedLocation={selectedLocation} />

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Menyimpan..." : "Simpan Alamat"}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
