import { useState, useEffect } from "react";
import api from "../../../utils/api";

export const useAddressData = (formData) => {
  const [provinces, setProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubDistricts, setAvailableSubDistricts] = useState([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubDistricts, setIsLoadingSubDistricts] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setIsLoadingProvinces(true);
        const response = await api.get("/address/provinces");
        setProvinces(response.data || []);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        setProvinces([]);
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    const fetchCities = async () => {
      // Skip if no province info available
      if (!formData.provinceId && !formData.province) {
        setAvailableCities([]);
        return;
      }

      try {
        setIsLoadingCities(true);
        let response;

        // If we have province ID, use it directly
        if (formData.provinceId) {
          response = await api.get(`/address/regencies/${formData.provinceId}`);
        }
        // Otherwise, use province name to fetch
        else if (formData.province) {
          response = await api.get(
            `/address/regencies/by-province-name/${encodeURIComponent(
              formData.province
            )}`
          );
        }

        setAvailableCities(response?.data || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
        setAvailableCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, [formData.provinceId, formData.province]);

  // Fetch districts when city changes
  useEffect(() => {
    const fetchDistricts = async () => {
      // Skip if no city info available
      if (!formData.cityId && !formData.city) {
        setAvailableDistricts([]);
        return;
      }

      try {
        setIsLoadingDistricts(true);
        let response;

        // If we have city ID, use it directly
        if (formData.cityId) {
          response = await api.get(`/address/districts/${formData.cityId}`);
        }
        // Otherwise, use city and province names
        else if (formData.city && formData.province) {
          response = await api.get(
            `/address/districts/by-regency-name/${encodeURIComponent(
              formData.province
            )}/${encodeURIComponent(formData.city)}`
          );
        }

        setAvailableDistricts(response?.data || []);
      } catch (error) {
        console.error("Error fetching districts:", error);
        setAvailableDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [formData.cityId, formData.city, formData.province]);

  // Fetch sub-districts when district changes
  useEffect(() => {
    const fetchSubDistricts = async () => {
      // Skip if no district info available
      if (!formData.districtId && !formData.district) {
        setAvailableSubDistricts([]);
        return;
      }

      try {
        setIsLoadingSubDistricts(true);
        let response;

        // If we have district ID, use it directly
        if (formData.districtId) {
          response = await api.get(`/address/villages/${formData.districtId}`);
        }
        // Otherwise, use district, city, and province names
        else if (formData.district && formData.city && formData.province) {
          response = await api.get(
            `/address/villages/by-district-name/${encodeURIComponent(
              formData.province
            )}/${encodeURIComponent(formData.city)}/${encodeURIComponent(
              formData.district
            )}`
          );
        }

        setAvailableSubDistricts(response?.data || []);
      } catch (error) {
        console.error("Error fetching sub-districts:", error);
        setAvailableSubDistricts([]);
      } finally {
        setIsLoadingSubDistricts(false);
      }
    };

    fetchSubDistricts();
  }, [
    formData.districtId,
    formData.district,
    formData.city,
    formData.province,
  ]);

  return {
    provinces,
    availableCities,
    availableDistricts,
    availableSubDistricts,
    isLoadingProvinces,
    isLoadingCities,
    isLoadingDistricts,
    isLoadingSubDistricts,
  };
};
