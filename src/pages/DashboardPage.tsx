import { useState } from 'react';
import { AlertTriangle, Car, Clock3, Radio, ShieldAlert, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import FadeIn from '../components/ui/FadeIn';
import DateRangeFilter from '../components/ui/DateRangeFilter';
import StatTile from '../features/dashboard/StatTile';
import GateStatusPanel from '../features/dashboard/GateStatusPanel';
import ActiveVehiclesPanel from '../features/dashboard/ActiveVehiclesPanel';
import AlertsPanel from '../features/dashboard/AlertsPanel';
import SystemHealthPanel from '../features/dashboard/SystemHealthPanel';
import QuickLinksPanel from '../features/dashboard/QuickLinksPanel';
import DashboardSkeleton from '../features/dashboard/DashboardSkeleton';
import WeeklyTrafficChart from '../features/dashboard/charts/WeeklyTrafficChart';
import HourlyActivityChart from '../features/dashboard/charts/HourlyActivityChart';
import AccessOutcomeDonut from '../features/dashboard/charts/AccessOutcomeDonut';
import RegisteredFleetChart from '../features/dashboard/charts/RegisteredFleetChart';
import { useDashboardData } from '../features/dashboard/useDashboardData';
import { getRangeForPreset, isWithinRange, type RangePreset } from '../utils/dateRange';
import { getLast7DayCounts } from '../utils/chartData';

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 first:mt-0">
      {children}
    </p>
  );
}

export default function DashboardPage() {
  const data = useDashboardData();
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const range = getRangeForPreset(preset, customDate);

  const overstayedCount = data.activeVehicles.filter((v) => v.is_overstayed).length;
  const authorizedActiveCount = data.authorizedVehicles.filter((v) => v.is_active).length;
  const enabledGates = data.gates.filter((g) => g.enabled);
  const gatesOnlineCount = enabledGates.filter(
    (g) => data.health?.camera.cameras[g.camera_id]?.status === 'ok',
  ).length;
  const unauthorizedInRange = data.unauthorizedAttempts.filter((a) =>
    isWithinRange(a.timestamp, range),
  ).length;

  const entriesTrend = getLast7DayCounts([
    ...data.activeVehicles.map((v) => v.entry_time),
    ...data.history.map((h) => h.entry_time),
  ]);
  const unauthorizedTrend = getLast7DayCounts(data.unauthorizedAttempts.map((a) => a.timestamp));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Live overview of vehicle access activity"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              preset={preset}
              customDate={customDate}
              onChange={(p, d) => {
                setPreset(p);
                if (d) setCustomDate(d);
              }}
            />
          </div>
        }
      />

      {data.loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {data.errors.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Some data couldn&apos;t be refreshed just now — showing the last known values for
              those sections.
            </div>
          )}

          <SectionLabel>Key Metrics</SectionLabel>
          <FadeIn delay={80} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              icon={Car}
              label="Active Vehicles"
              value={data.activeVehicles.length}
              sublabel="Live"
              to="/monitoring/tracking"
              trend={entriesTrend}
            />
            <StatTile
              icon={Clock3}
              label="Overstayed"
              value={overstayedCount}
              sublabel="Live"
              tone={overstayedCount > 0 ? 'danger' : 'default'}
              to="/monitoring/tracking"
            />
            <StatTile
              icon={ShieldCheck}
              label="Authorized"
              value={authorizedActiveCount}
              sublabel="Live"
              tone="success"
              to="/masters/vehicles"
            />
            <StatTile
              icon={ShieldAlert}
              label="Unauthorized"
              value={unauthorizedInRange}
              sublabel={range.label}
              tone={unauthorizedInRange > 0 ? 'danger' : 'default'}
              to="/monitoring/tracking"
              trend={unauthorizedTrend}
            />
            <StatTile
              icon={Radio}
              label="Gates Online"
              value={`${gatesOnlineCount}/${enabledGates.length}`}
              sublabel="Live"
              tone={gatesOnlineCount === enabledGates.length ? 'success' : 'warning'}
              to="/masters/gates"
            />
          </FadeIn>

          <SectionLabel>Activity & Gates</SectionLabel>
          <FadeIn delay={160} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <HourlyActivityChart activeVehicles={data.activeVehicles} history={data.history} />
            <GateStatusPanel gates={data.gates} health={data.health} />
          </FadeIn>

          <SectionLabel>Live Operations</SectionLabel>
          <FadeIn delay={240} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ActiveVehiclesPanel vehicles={data.activeVehicles} />
            <QuickLinksPanel />
          </FadeIn>

          <SectionLabel>Registered Fleet</SectionLabel>
          <FadeIn delay={320} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RegisteredFleetChart vehicles={data.authorizedVehicles} />
          </FadeIn>

          <SectionLabel>Traffic Trends</SectionLabel>
          <FadeIn delay={400} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <WeeklyTrafficChart activeVehicles={data.activeVehicles} history={data.history} />
            <AccessOutcomeDonut
              activeVehicles={data.activeVehicles}
              history={data.history}
              unauthorizedAttempts={data.unauthorizedAttempts}
            />
          </FadeIn>

          <SectionLabel>Alerts & Infrastructure</SectionLabel>
          <FadeIn delay={480} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AlertsPanel
              unauthorizedAttempts={data.unauthorizedAttempts}
              activeVehicles={data.activeVehicles}
              health={data.health}
            />
            <SystemHealthPanel health={data.health} />
          </FadeIn>
        </>
      )}
    </div>
  );
}
