import { Camera, LogIn, LogOut, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatTile from '../features/dashboard/StatTile';
import GateMonitorCard from '../features/liveMonitoring/GateMonitorCard';
import LiveMonitoringSkeleton from '../features/liveMonitoring/LiveMonitoringSkeleton';
import { useDashboardData } from '../features/dashboard/useDashboardData';
import type { GateConfig } from '../types/gate';
import type { ActiveVehicle, HistoryRecord } from '../types/detection';

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function countToday(gate: GateConfig, activeVehicles: ActiveVehicle[], history: HistoryRecord[]) {
  if (gate.direction === 'entry') {
    return (
      activeVehicles.filter((v) => v.cam_id === gate.camera_id && isToday(v.entry_time)).length +
      history.filter((h) => h.entry_cam_id === gate.camera_id && isToday(h.entry_time)).length
    );
  }
  return history.filter((h) => h.exit_cam_id === gate.camera_id && isToday(h.exit_time)).length;
}

export default function MonitoringLivePage() {
  const data = useDashboardData();
  const activeGates = data.gates.filter((gate) => gate.enabled);

  const onlineCount = activeGates.filter(
    (g) => data.health?.camera.cameras[g.camera_id]?.status === 'ok',
  ).length;
  const entriesToday =
    data.activeVehicles.filter((v) => isToday(v.entry_time)).length +
    data.history.filter((h) => isToday(h.entry_time)).length;
  const exitsToday = data.history.filter((h) => isToday(h.exit_time)).length;
  const visitorPlates = new Set(
    data.authorizedVehicles.filter((v) => v.list_type === 'visitor').map((v) => v.plate_number),
  );
  const visitorsToday =
    data.activeVehicles.filter((v) => visitorPlates.has(v.plate_number) && isToday(v.entry_time))
      .length +
    data.history.filter((h) => visitorPlates.has(h.plate_number) && isToday(h.entry_time)).length;

  return (
    <div className="space-y-4">
      <PageHeader title="Live View" description="Real-time camera feeds and gate activity" />

      {data.loading ? (
        <LiveMonitoringSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={Camera}
              label="Cameras Online"
              value={`${onlineCount}/${activeGates.length}`}
              tone={onlineCount === activeGates.length ? 'success' : 'warning'}
            />
            <StatTile icon={LogIn} label="Entries Today" value={entriesToday} tone="success" />
            <StatTile icon={LogOut} label="Exits Today" value={exitsToday} />
            <StatTile icon={Users} label="Visitors Today" value={visitorsToday} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeGates.map((gate) => (
              <GateMonitorCard
                key={gate.id}
                gate={gate}
                health={data.health}
                activeVehicles={data.activeVehicles}
                history={data.history}
                unauthorizedAttempts={data.unauthorizedAttempts}
                authorizedVehicles={data.authorizedVehicles}
                todayCount={countToday(gate, data.activeVehicles, data.history)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
