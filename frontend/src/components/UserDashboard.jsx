import ImageSlider from "./ImageSlider";
import { mockImages } from "../utils/mockImages";
import { CategoryGrid } from "./CategoryGrid";
import TrendingProducts from "./TrendingProducts";
import NewProduct from "./NewProduct";
import { usePromotionalImages } from "../hooks/usePromotional";
import { Loader2 } from "lucide-react";

const UserDashboard = () => {
  const { images, loading, error } = usePromotionalImages();

  // Fallback to mockImages if no promotional images or error
  const sliderImages = images.length > 0 ? images : mockImages;

  return (
    <div className="bg-gray-60 pt-12 pb-8">
      {/* Image Slider */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="w-full h-96 bg-gray-200 rounded-xl flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
          </div>
        ) : (
          <ImageSlider images={sliderImages} autoSlideInterval={4000} />
        )}
        {error && (
          <p className="text-sm text-red-600 mt-2 text-center">
            {error} - Showing default images
          </p>
        )}
      </div>

      {/* Featured Categories */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoryGrid />
      </div>

      {/* Trending Products */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrendingProducts />
      </div>

      {/* New Products */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewProduct />
      </div>
    </div>
  );
};

export default UserDashboard;