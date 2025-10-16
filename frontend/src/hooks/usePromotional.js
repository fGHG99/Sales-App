import { useState, useEffect } from "react";
import { getPromotionals } from "../services/promotionalService";

/**
 * Custom hook to fetch and format promotional images for ImageSlider
 * @returns {Object} { images, loading, error, refetch }
 */
export const usePromotionalImages = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BE_URL = import.meta.env.VITE_BE_API_URL || "";

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPromotionals();

      if (data && data.success && Array.isArray(data.promotionals)) {
        // Format images for ImageSlider component
        const formattedImages = data.promotionals.map((promotional) => ({
          url: `${BE_URL}${promotional.imageUrl}`,
          alt: promotional.altText,
        }));

        setImages(formattedImages);
        console.log("✅ [Promotional Helper] Images loaded:", formattedImages.length);
      } else {
        console.error("❌ [Promotional Helper] Invalid response structure:", data);
        setImages([]);
        setError("Invalid data format received from server");
      }
    } catch (err) {
      console.error("❌ [Promotional Helper] Error fetching images:", err);
      setError(err.response?.data?.error || "Failed to fetch promotional images");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
  };
};