import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WarehouseSkeleton() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:border-purple-300/50">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-12 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WarehouseListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <WarehouseSkeleton key={index} />
      ))}
    </div>
  );
}
