import { Skeleton } from "../ui/skeleton";

/**
 * CategoryGridSkeleton Component
 *
 * Loading skeleton untuk CategoryGrid di UserDashboard
 * Menampilkan placeholder animasi saat data sedang di-fetch
 *
 * @param {number} count - Jumlah skeleton yang ditampilkan (default: 8)
 */
const CategoryGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="space-y-6">
      {/* Section Title Skeleton */}
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Category Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="text-center space-y-3">
            {/* Category Icon Skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>

            {/* Category Name Skeleton */}
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryGridSkeleton;
