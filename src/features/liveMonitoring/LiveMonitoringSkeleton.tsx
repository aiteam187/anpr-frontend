import { Skeleton, SkeletonStatTiles } from '../../components/ui/Skeleton';

export default function LiveMonitoringSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonStatTiles count={4} gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-4" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="mt-3 h-40 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
