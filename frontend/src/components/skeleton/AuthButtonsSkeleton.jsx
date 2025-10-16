import { Skeleton } from "../ui/skeleton";

/**
 * AuthButtonsSkeleton Component
 *
 * Loading skeleton untuk auth buttons (Masuk/Daftar) di Navbar
 * Menampilkan placeholder untuk tombol login dan register
 * Digunakan saat sedang menentukan status authentication
 */
const AuthButtonsSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      {/* Cart Skeleton */}
      <div className="relative p-2">
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* Masuk Button Skeleton */}
      <Skeleton className="h-9 w-20 rounded-lg" />

      {/* Daftar Button Skeleton */}
      <Skeleton className="h-9 w-20 rounded-lg" />
    </div>
  );
};

export default AuthButtonsSkeleton;
