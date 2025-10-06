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
      latitude: lat,
      longitude: lon,
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
    res
      .status(500)
      .json({ message: "Gagal mengambil data provinsi", error: err.message });
  }
});

// 2. Ambil semua kabupaten/kota berdasarkan ID provinsi
router.get("/regencies/:provinceId", async (req, res) => {
  try {
    const { provinceId } = req.params;
    const { data } = await axios.get(
      `${BASE_URL}/regencies/${provinceId}.json`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil data kabupaten/kota",
      error: err.message,
    });
  }
});

// 3. Ambil semua kecamatan berdasarkan ID kabupaten/kota
router.get("/districts/:regencyId", async (req, res) => {
  try {
    const { regencyId } = req.params;
    const { data } = await axios.get(`${BASE_URL}/districts/${regencyId}.json`);
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data kecamatan", error: err.message });
  }
});

// 4. Ambil semua kelurahan berdasarkan ID kecamatan
router.get("/villages/:districtId", async (req, res) => {
  try {
    const { districtId } = req.params;
    const { data } = await axios.get(`${BASE_URL}/villages/${districtId}.json`);
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data kelurahan", error: err.message });
  }
});

// 5. Cari ID provinsi berdasarkan nama
router.get("/provinces/search/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const { data } = await axios.get(`${BASE_URL}/provinces.json`);

    // Case-insensitive search
    const province = data.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    if (!province) {
      return res.status(404).json({ message: "Provinsi tidak ditemukan" });
    }

    res.json(province);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mencari provinsi", error: err.message });
  }
});

// 6. Cari kabupaten/kota berdasarkan nama provinsi
router.get("/regencies/by-province-name/:provinceName", async (req, res) => {
  try {
    const { provinceName } = req.params;

    // First, get all provinces to find the ID
    const provincesResponse = await axios.get(`${BASE_URL}/provinces.json`);
    const province = provincesResponse.data.find(
      (p) => p.name.toLowerCase() === provinceName.toLowerCase()
    );

    if (!province) {
      return res.status(404).json({ message: "Provinsi tidak ditemukan" });
    }

    // Then get regencies for that province
    const { data } = await axios.get(
      `${BASE_URL}/regencies/${province.id}.json`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil data kabupaten/kota",
      error: err.message,
    });
  }
});

// 7. Cari kecamatan berdasarkan nama kabupaten/kota dan provinsi
router.get(
  "/districts/by-regency-name/:provinceName/:regencyName",
  async (req, res) => {
    try {
      const { provinceName, regencyName } = req.params;

      // First, get province ID
      const provincesResponse = await axios.get(`${BASE_URL}/provinces.json`);
      const province = provincesResponse.data.find(
        (p) => p.name.toLowerCase() === provinceName.toLowerCase()
      );

      if (!province) {
        return res.status(404).json({ message: "Provinsi tidak ditemukan" });
      }

      // Then get regency ID
      const regenciesResponse = await axios.get(
        `${BASE_URL}/regencies/${province.id}.json`
      );
      const regency = regenciesResponse.data.find(
        (r) => r.name.toLowerCase() === regencyName.toLowerCase()
      );

      if (!regency) {
        return res
          .status(404)
          .json({ message: "Kabupaten/kota tidak ditemukan" });
      }

      // Finally get districts
      const { data } = await axios.get(
        `${BASE_URL}/districts/${regency.id}.json`
      );
      res.json(data);
    } catch (err) {
      res.status(500).json({
        message: "Gagal mengambil data kecamatan",
        error: err.message,
      });
    }
  }
);

// 8. Cari kelurahan berdasarkan nama kecamatan, kabupaten/kota, dan provinsi
router.get(
  "/villages/by-district-name/:provinceName/:regencyName/:districtName",
  async (req, res) => {
    try {
      const { provinceName, regencyName, districtName } = req.params;

      // First, get province ID
      const provincesResponse = await axios.get(`${BASE_URL}/provinces.json`);
      const province = provincesResponse.data.find(
        (p) => p.name.toLowerCase() === provinceName.toLowerCase()
      );

      if (!province) {
        return res.status(404).json({ message: "Provinsi tidak ditemukan" });
      }

      // Then get regency ID
      const regenciesResponse = await axios.get(
        `${BASE_URL}/regencies/${province.id}.json`
      );
      const regency = regenciesResponse.data.find(
        (r) => r.name.toLowerCase() === regencyName.toLowerCase()
      );

      if (!regency) {
        return res
          .status(404)
          .json({ message: "Kabupaten/kota tidak ditemukan" });
      }

      // Then get district ID
      const districtsResponse = await axios.get(
        `${BASE_URL}/districts/${regency.id}.json`
      );
      const district = districtsResponse.data.find(
        (d) => d.name.toLowerCase() === districtName.toLowerCase()
      );

      if (!district) {
        return res.status(404).json({ message: "Kecamatan tidak ditemukan" });
      }

      // Finally get villages
      const { data } = await axios.get(
        `${BASE_URL}/villages/${district.id}.json`
      );
      res.json(data);
    } catch (err) {
      res.status(500).json({
        message: "Gagal mengambil data kelurahan",
        error: err.message,
      });
    }
  }
);

/**
 * registrasi alamat user secara manual setelah user mendapatkan detail alamat dari reverse geocode
 * atau router get diataas
 */
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      recipientName,
      recipientPhone,
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

    if (!recipientName) {
      return res
        .status(400)
        .json({ success: false, message: "recipientName is required" });
    }

    if (!recipientPhone) {
      return res
        .status(400)
        .json({ success: false, message: "recipientPhone is required" });
    }

    // Simpan ke database (semua field manual dari user)
    const newAddress = await prisma.address.create({
      data: {
        user: { connect: { id: userId } },
        recipientName,
        recipientPhone,
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
    res.status(500).json({ success: false, message: "Gagal membuat alamat" });
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
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address)
      return res.status(404).json({ error: "Alamat tidak ditemukan" });
    return res.json(address);
  } catch (err) {
    console.error("GET /addresses/:id error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

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
