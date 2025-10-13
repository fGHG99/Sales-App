import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

const OrderCardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="mb-4">
          <CardContent className="p-6">
            {/* Header - Order ID and Status Badge */}
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-7 w-32" /> {/* Order ID */}
              <Skeleton className="h-6 w-24 rounded-full" />{" "}
              {/* Status Badge */}
            </div>

            {/* Store and Customer Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Pickup Location */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" /> {/* Section Title */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex items-start space-x-2">
                    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" /> {/* Section Title */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <Skeleton className="h-5 w-24 mb-2" /> {/* Section Title */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default OrderCardSkeleton;
