import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleCheck as CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderStatusTracker({
  statusHistory,
  currentStatus,
  formatDateTime,
  getStatusLabel,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Pesanan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {statusHistory.map((status, index) => {
            const isCompleted = index < currentStatus;
            const isCurrent = index === currentStatus;
            const isLast = index === statusHistory.length - 1;

            return (
              <div key={index} className="relative">
                <div className="flex items-start gap-4 pb-8">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isCompleted || isCurrent
                          ? "border-blue-500 bg-blue-500 shadow-lg shadow-blue-500/30"
                          : "border-gray-300 bg-white"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : isCurrent ? (
                        <div className="relative">
                          <Circle className="h-5 w-5 text-white animate-pulse" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        </div>
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </div>

                    {!isLast && (
                      <div
                        className={cn(
                          "absolute top-10 h-full w-0.5 transition-all duration-300",
                          isCompleted
                            ? "bg-blue-500"
                            : isCurrent
                            ? "bg-gradient-to-b from-blue-500 to-gray-300"
                            : "bg-gray-300"
                        )}
                      />
                    )}
                  </div>

                  <div className="flex-1 pt-1.5">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex-1">
                        <h3
                          className={cn(
                            "font-semibold mb-1 transition-colors",
                            isCompleted || isCurrent
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {status.status}
                        </h3>

                        {status.timestamp && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDateTime(status.timestamp)}</span>
                          </div>
                        )}

                        {!status.timestamp && isCurrent && (
                          <p className="text-sm text-blue-600 font-medium">
                            Sedang diproses...
                          </p>
                        )}
                      </div>

                      {getStatusLabel(index) && (
                        <Badge
                          variant={
                            getStatusLabel(index) === "Selesai"
                              ? "default"
                              : "secondary"
                          }
                          className={cn(
                            "transition-all",
                            getStatusLabel(index) === "Selesai"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-blue-500 hover:bg-blue-600 text-white animate-pulse"
                          )}
                        >
                          {getStatusLabel(index)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
