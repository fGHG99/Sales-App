import { Skeleton } from "../ui/skeleton";

/**
 * TrendingProductsSkeleton Component
 *
 * Loading skeleton untuk TrendingProducts di UserDashboard
 * Menampilkan placeholder animasi saat data sedang di-fetch
 *
 * @param {number} count - Jumlah skeleton yang ditampilkan (default: 4)
 */
const TrendingProductsSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-6">
      {/* Section Title Skeleton */}
      <div className="text-center">
        <Skeleton className="h-8 w-56 mx-auto mb-2" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border p-4 space-y-4"
          >
            {/* Product Image Skeleton */}
            <div className="aspect-square w-full">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-2">
              {/* Product Name Skeleton */}
              <Skeleton className="h-5 w-3/4" />

              {/* Product Price Skeleton */}
              <Skeleton className="h-6 w-1/2" />

              {/* Rating Skeleton */}
              <div className="flex items-center space-x-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-8 ml-2" />
              </div>
            </div>

            {/* Add to Cart Button Skeleton */}
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingProductsSkeleton;
