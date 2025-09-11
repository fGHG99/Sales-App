import express from "express";

const router = express.Router();

// in-memory store lokasi kurir sementara
const courierLocations = new Map();

/**
 * Kurir update lokasi setiap 10 detik
 * Lokasi hanya disimpan sementara di memory
 */
router.post("/update-location", (req, res) => {
  try {
    const { courierId, latitude, longitude } = req.body;

    if (!courierId || !latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, message: "courierId, latitude, longitude wajib diisi" });
    }

    courierLocations.set(courierId, {
      latitude,
      longitude,
      updatedAt: new Date(),
    });

    res.json({ success: true, message: "Lokasi kurir berhasil diupdate sementara" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal update lokasi kurir" });
  }
});

/**
 * User melihat lokasi kurir
 */
router.get("/:courierId/location", (req, res) => {
  const { courierId } = req.params;

  const location = courierLocations.get(courierId);

  if (!location) {
    return res
      .status(404)
      .json({ success: false, message: "Lokasi kurir tidak ditemukan atau belum diupdate" });
  }

  res.json({
    success: true,
    data: {
      courierId,
      ...location,
    },
  });
});

export default router;