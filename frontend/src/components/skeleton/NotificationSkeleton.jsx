import { Skeleton } from "../ui/skeleton";

/**
 * NotificationSkeleton Component
 *
 * Loading skeleton untuk notification card di dropdown
 * Menampilkan placeholder animasi saat data sedang di-fetch
 *
 * @param {number} count - Jumlah skeleton yang ditampilkan (default: 3)
 */
const NotificationSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-3 border-l-4 border-l-gray-200 bg-gray-50"
        >
          <div className="flex items-start space-x-3">
            {/* Icon Skeleton */}
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

            {/* Content Skeleton */}
            <div className="flex-1 space-y-2">
              {/* Title Skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-2 rounded-full" />
              </div>

              {/* Message Skeleton */}
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />

              {/* Footer Skeleton */}
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default NotificationSkeleton;
