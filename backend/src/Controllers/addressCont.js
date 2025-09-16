// routes/address.js
import router from "../../utils/express.js";
import axios from "axios";
import prisma from "../../utils/prisma.js";

const LOCATIONIQ_KEY = process.env.LOCATIONIQ_KEY;
const BASE_URL = process.env.BASE_URL;

/**
 * get alamat user dengan menggunakan reverse geocoding untuk menambahkan alamat ke dalam form
 * 
 */
router.get("/", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon are required" });
    }

    const response = await axios.get("https://us1.locationiq.com/v1/reverse", {
      params: {
        key: LOCATIONIQ_KEY,
        lat,
        lon,
        format: "json",
        addressdetails: 1,
      },
    });

    const address = response.data.address;

    // Mapping agar sesuai dengan kebutuhan
    const result = {
      sub_district: address.suburb || address.village || address.hamlet || null, 
      district: address.city_district || address.county || null,
      city: address.city || address.town || address.municipality || null,
      province: address.state || null,
      country: address.country || null,
      postal_code: address.postcode || null,
      latitude : lat,
      longitude : lon,
    };

    res.json(result);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch reverse geocode" });
  }
});

// 1. Ambil semua provinsi
router.get("/provinces", async (req, res) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/provinces.json`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data provinsi", error: err.message });
  }
});

// 2. Ambil semua kabupaten/kota berdasarkan ID provinsi
router.get("/regencies/:provinceId", async (req, res) => {
  try {
    const { provinceId } = req.params;
    const { data } = await axios.get(`${BASE_URL}/regencies/${provinceId}.json`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data kabupaten/kota", error: err.message });
  }
});

// 3. Ambil semua kecamatan berdasarkan ID kabupaten/kota
router.get("/districts/:regencyId", async (req, res) => {
  try {
    const { regencyId } = req.params;
    const { data } = await axios.get(`${BASE_URL}/districts/${regencyId}.json`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data kecamatan", error: err.message });
  }
});

// 4. Ambil semua kelurahan berdasarkan ID kecamatan
router.get("/villages/:districtId", async (req, res) => {
  try {
    const { districtId } = req.params;
    const { data } = await axios.get(`${BASE_URL}/villages/${districtId}.json`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data kelurahan", error: err.message });
  }
});

/**
 * registrasi alamat user secara manual setelah user mendapatkan detail alamat dari reverse geocode
 * atau router get diataas
 */
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      label,
      fullAddress,
      subDistrict,
      district,
      city,
      province,
      country,
      postalCode,
      latitude,
      longitude,
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    if (!fullAddress) {
      return res
        .status(400)
        .json({ success: false, message: "fullAddress wajib diberikan" });
    }

    // Simpan ke database (semua field manual dari user)
    const newAddress = await prisma.address.create({
      data: {
        user: { connect: { id: userId } },
        label,
        fullAddress,
        subDistrict,
        district,
        city,
        province,
        country,
        postalCode,
        latitude,
        longitude,
      },
    });

    res.json({ success: true, data: newAddress });
  } catch (error) {
    console.error("Error membuat alamat:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Gagal membuat alamat" });
  }
});

// GET /addresses/user/:userId  => ambil semua alamat user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await prisma.address.findMany({
      where: { userId },
    });
    return res.json(addresses);
  } catch (err) {
    console.error("GET /addresses/user/:userId error:", err);
    return res
      .status(500)
      .json({ error: "Server error saat mengambil alamat user" });
  }
});

// GET /addresses/:id => detail alamat
// router.get("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const address = await prisma.address.findUnique({ where: { id } });
//     if (!address)
//       return res.status(404).json({ error: "Alamat tidak ditemukan" });
//     return res.json(address);
//   } catch (err) {
//     console.error("GET /addresses/:id error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// });

// PUT /addresses/:id => update alamat manual (label atau fields)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body; // ex: { label, street, city, ... }

    // pastikan tidak mengubah userId via endpoint ini (opsional)
    if (payload.userId) delete payload.userId;

    const updated = await prisma.address.update({
      where: { id },
      data: payload,
    });

    return res.json(updated);
  } catch (err) {
    console.error("PUT /addresses/:id error:", err);
    return res.status(500).json({ error: "Server error saat update alamat" });
  }
});

// DELETE /addresses/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({ where: { id } });
    return res.json({ message: "Alamat berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /addresses/:id error:", err);
    return res
      .status(500)
      .json({ error: "Server error saat menghapus alamat" });
  }
});

export default router;
