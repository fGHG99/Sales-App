export const useAddressValidation = () => {
  const validateForm = (formData) => {
    const newErrors = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Nama penerima harus diisi";
    }

    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = "Nomor telepon harus diisi";
    } else if (!/^(\+62|62|0)[0-9]{9,13}$/.test(formData.recipientPhone)) {
      newErrors.recipientPhone = "Format nomor telepon tidak valid";
    }

    if (!formData.label.trim()) {
      newErrors.label = "Label alamat harus diisi";
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

    return newErrors;
  };

  return { validateForm };
};
