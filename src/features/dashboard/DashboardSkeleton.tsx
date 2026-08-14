import Panel from '../../components/ui/Panel';
import { SkeletonChart, SkeletonList, SkeletonStatTiles, SkeletonTable } from '../../components/ui/Skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonStatTiles count={6} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Weekly Traffic" className="lg:col-span-2">
          <SkeletonChart />
        </Panel>
        <Panel title="Access Outcomes Today">
          <SkeletonChart />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Today's Activity">
          <SkeletonChart />
        </Panel>
        <Panel title="Gate Status">
          <SkeletonTable columns={4} rows={3} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Active Vehicles" className="lg:col-span-2">
          <SkeletonTable columns={6} rows={4} />
        </Panel>
        <Panel title="Active Alerts">
          <SkeletonList rows={4} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="System Health">
          <SkeletonList rows={5} />
        </Panel>
      </div>
    </div>
  );
}
