// src/components/User/user-cart/CartSkeleton.jsx

export default function CartSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 w-64 bg-muted animate-pulse rounded-md mb-2"></div>
          <div className="h-5 w-96 bg-muted animate-pulse rounded-md"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery and Payment sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Section Skeleton */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded-md"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md"></div>
                </div>
              </div>

              {/* Payment Section Skeleton */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded-md"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md"></div>
                </div>
              </div>
            </div>

            {/* Address Section Skeleton */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                <div className="h-6 w-40 bg-muted animate-pulse rounded-md"></div>
              </div>
              <div className="h-20 w-full bg-muted animate-pulse rounded-md"></div>
            </div>

            {/* Order Items Section Skeleton */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded-md"></div>
                </div>
                <div className="h-9 w-24 bg-muted animate-pulse rounded-md"></div>
              </div>

              {/* Cart Item Skeletons */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-t">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
                  <div className="w-20 h-20 bg-muted animate-pulse rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded-md"></div>
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
                    <div className="h-5 w-8 bg-muted animate-pulse rounded-md"></div>
                    <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="h-6 w-24 bg-muted animate-pulse rounded-md"></div>
                  <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side skeleton - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-4">
              <div className="h-6 w-32 bg-muted animate-pulse rounded-md mb-6"></div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-4">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-md"></div>
                    <div className="h-5 w-32 bg-muted animate-pulse rounded-md"></div>
                  </div>
                  <div className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
