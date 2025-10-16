import { Skeleton } from "../ui/skeleton";

/**
 * NewProductSkeleton Component
 *
 * Loading skeleton untuk NewProduct di UserDashboard
 * Menampilkan placeholder animasi saat data sedang di-fetch
 *
 * @param {number} count - Jumlah skeleton yang ditampilkan (default: 6)
 */
const NewProductSkeleton = ({ count = 6 }) => {
  return (
    <div className="space-y-6">
      {/* Section Title Skeleton */}
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border p-3 space-y-3"
          >
            {/* Product Image Skeleton */}
            <div className="aspect-square w-full">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-2">
              {/* Product Name Skeleton */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />

              {/* Product Price Skeleton */}
              <Skeleton className="h-5 w-1/2" />

              {/* Badge Skeleton */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>

            {/* Add to Cart Button Skeleton */}
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewProductSkeleton;
