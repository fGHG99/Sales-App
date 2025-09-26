import { Card, CardHeader, CardContent } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { Separator } from "../../ui/separator";

const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 space-y-3">
          <Skeleton className="h-9 w-64 bg-gray-200" />
          <Skeleton className="h-5 w-96 bg-gray-200" />
        </div>

        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded bg-gray-200" />
              <Skeleton className="h-7 w-64 bg-gray-200" />
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Profile Picture Skeleton */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <Skeleton className="h-32 w-32 rounded-full bg-gray-200" />
              </div>

              <div className="text-center space-y-3">
                <div className="flex gap-3 justify-center">
                  <Skeleton className="h-9 w-32 bg-gray-200" />
                </div>
                <Skeleton className="h-4 w-56 bg-gray-200" />
              </div>
            </div>

            <Separator className="bg-gray-200" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Column Skeleton */}
              <div className="space-y-8">
                {/* Username */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                  <Skeleton className="h-12 w-full bg-gray-200" />
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28 bg-gray-200" />
                    <Skeleton className="h-5 w-20 bg-gray-200" />
                  </div>
                  <Skeleton className="h-12 w-full bg-gray-200" />
                  <Skeleton className="h-9 w-40 bg-gray-200" />
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32 bg-gray-200" />
                    <Skeleton className="h-5 w-24 bg-gray-200" />
                  </div>
                  <Skeleton className="h-12 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-64 bg-gray-200" />
                </div>
              </div>

              {/* Right Column Skeleton */}
              <div className="space-y-8">
                {/* Gender */}
                <div className="space-y-4">
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                  <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full bg-gray-200" />
                      <Skeleton className="h-4 w-12 bg-gray-200" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full bg-gray-200" />
                      <Skeleton className="h-4 w-16 bg-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28 bg-gray-200" />
                  <Skeleton className="h-12 w-full bg-gray-200" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Action Buttons Skeleton */}
            <div className="flex justify-end gap-4">
              <Skeleton className="h-11 w-24 bg-gray-200" />
              <Skeleton className="h-11 w-36 bg-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
