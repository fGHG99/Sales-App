// routes/address.js
import router from "../../utils/express.js";
import axios from "axios";
import prisma from "../../utils/prisma.js";

const LOCATIONIQ_KEY = process.env.LOCATIONIQ_KEY;

/**
 * Registrasi alamat user
 * - Jika user kasih lat/lng saja → reverse geocoding untuk detail alamat
 * - Jika user kasih alamat saja (tanpa lat/lng) → forward geocoding untuk dapat lat/lng
 */
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      label,
      fullAddress, // alamat lengkap isi manual oleh user
      latitude,
      longitude,
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude dan longitude wajib diberikan",
      });
    }

    // Default values
    let finalSubDistrict = "";
    let finalDistrict = "";
    let finalCity="";
    let finalProvince = "";
    let finalCountry = "";
    let finalPostal = "";

    // Ambil detail administratif berdasarkan lat/lng
    const response = await axios.get(
      "https://us1.locationiq.com/v1/reverse.php",
      {
        params: {
          key: LOCATIONIQ_KEY,
          lat: latitude,
          lon: longitude,
          format: "json",
        },
      }
    );

    const data = response.data;
    if (data && data.address) {
      finalSubDistrict =
        data.address.town ||
        data.address.suburb ||
        data.address.village ||
        data.address.neighbourhood ||
        "";

      finalDistrict = data.address.subdistrict || data.address.town || "";

      finalCity =
        data.address.city || // kota besar
        data.address.county || // biasanya bisa dipakai untuk kota/kabupaten
        data.address.town || // kota kecil
        data.address.municipality || // kota administratif di OSM
        "";

      finalProvince = data.address.state || "";
      finalCountry = data.address.country || "Unknown";
      finalPostal = data.address.postcode || "00000";

      console.log("Reverse geocoding result:", data.address);
    }

    // Simpan ke database
    const address = await prisma.address.create({
      data: {
        user: { connect: { id: userId } },
        label,
        fullAddress, // pakai alamat manual dari user
        sub_district: finalSubDistrict,
        district: finalDistrict,
        city: finalCity,
        province: finalProvince,
        country: finalCountry,
        postal_code: finalPostal,
        latitude,
        longitude,
      },
    });

    res.json({ success: true, data: address });
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
