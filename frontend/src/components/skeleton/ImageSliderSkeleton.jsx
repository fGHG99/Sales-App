import { Skeleton } from "../ui/skeleton";

/**
 * ImageSliderSkeleton Component
 *
 * Loading skeleton untuk ImageSlider di UserDashboard
 * Menampilkan placeholder animasi saat data sedang di-fetch
 *
 * @param {number} count - Jumlah skeleton yang ditampilkan (default: 3)
 */
const ImageSliderSkeleton = ({ count = 3 }) => {
  return (
    <div className="relative">
      {/* Main Image Skeleton */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />

        {/* Navigation Dots Skeleton */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {Array.from({ length: count }).map((_, index) => (
            <Skeleton key={index} className="h-2 w-2 rounded-full" />
          ))}
        </div>
      </div>

      {/* Navigation Arrows Skeleton */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
};

export default ImageSliderSkeleton;
