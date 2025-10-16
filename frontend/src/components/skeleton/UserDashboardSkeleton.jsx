import ImageSliderSkeleton from "./ImageSliderSkeleton";
import CategoryGridSkeleton from "./CategoryGridSkeleton";
import TrendingProductsSkeleton from "./TrendingProductsSkeleton";
import NewProductSkeleton from "./NewProductSkeleton";

/**
 * UserDashboardSkeleton Component
 *
 * Loading skeleton untuk UserDashboard
 * Menampilkan placeholder animasi untuk semua section saat data sedang di-fetch
 * Menggunakan komponen skeleton individual untuk setiap section
 */
const UserDashboardSkeleton = () => {
  return (
    <div className="bg-gray-60 pt-12 pb-8">
      {/* Image Slider Skeleton */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImageSliderSkeleton count={3} />
      </div>

      {/* Featured Categories Skeleton */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoryGridSkeleton count={8} />
      </div>

      {/* Trending Products Skeleton */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrendingProductsSkeleton count={4} />
      </div>

      {/* New Products Skeleton */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewProductSkeleton count={6} />
      </div>
    </div>
  );
};

export default UserDashboardSkeleton;
