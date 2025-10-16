import { Skeleton } from "../ui/skeleton";

/**
 * AuthSectionSkeleton Component
 *
 * Loading skeleton untuk AuthSection di Navbar
 * Menampilkan placeholder untuk cart, notification, order, dan user profile
 * Digunakan saat data sedang di-fetch dari API
 */
const AuthSectionSkeleton = () => {
  return (
    <div className="flex items-center space-x-2">
      {/* Cart Skeleton */}
      <div className="relative p-2">
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* Notification Skeleton */}
      <div className="relative p-2">
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* Order Skeleton */}
      <div className="relative p-2">
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* Separator Skeleton */}
      <div className="h-6 w-px bg-gray-200 mx-1" />

      {/* User Profile Skeleton */}
      <div className="flex items-center space-x-1">
        {/* Avatar Skeleton */}
        <Skeleton className="w-8 h-8 rounded-full" />

        {/* Username Skeleton */}
        <Skeleton className="h-4 w-12 ml-2" />

        {/* Chevron Skeleton */}
        <Skeleton className="w-4 h-4" />
      </div>
    </div>
  );
};

export default AuthSectionSkeleton;
