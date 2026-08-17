import { useState } from 'react';
import { AlertTriangle, Ban, Car, Clock3, DoorOpen, LogOut, Radio, ShieldCheck, Users } from 'lucide-react';
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
import FleetRegistrationChart from '../features/dashboard/charts/FleetRegistrationChart';
import ComplianceOverviewChart from '../features/dashboard/charts/ComplianceOverviewChart';
import { useDashboardData } from '../features/dashboard/useDashboardData';
import { getRangeForPreset, isWithinRange, type RangePreset } from '../utils/dateRange';

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
  const enabledGates = data.gates.filter((g) => g.enabled);
  const gatesOnlineCount = enabledGates.filter(
    (g) => data.health?.camera.cameras[g.camera_id]?.status === 'ok',
  ).length;
  const totalVehiclesCount = data.authorizedVehicles.length;
  const whitelistCount = data.authorizedVehicles.filter(
    (v) => v.list_type === 'whitelist' && v.is_active,
  ).length;
  const blacklistCount = data.authorizedVehicles.filter(
    (v) => v.list_type === 'blacklist' && v.is_active,
  ).length;
  const visitorsCount = data.authorizedVehicles.filter(
    (v) => v.list_type === 'visitor' && v.is_active,
  ).length;
  const exitsInRange = data.history.filter((h) => isWithinRange(h.exit_time, range)).length;

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
          <FadeIn delay={80} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatTile
              icon={Car}
              label="Total Vehicles"
              value={totalVehiclesCount}
              sublabel="Registered"
              to="/masters/vehicles"
            />
            <StatTile
              icon={DoorOpen}
              label="Active Vehicles"
              value={data.activeVehicles.length}
              sublabel="Inside Gate"
              to="/monitoring/tracking"
            />
            <StatTile
              icon={LogOut}
              label="Exit Vehicles"
              value={exitsInRange}
              sublabel={range.label}
              to="/monitoring/tracking"
            />
            <StatTile
              icon={Users}
              label="Visitors"
              value={visitorsCount}
              sublabel="Live"
              to="/masters/visitors"
            />
            <StatTile
              icon={ShieldCheck}
              label="Whitelist"
              value={whitelistCount}
              sublabel="Live"
              tone="success"
              to="/masters/vehicles"
            />
            <StatTile
              icon={Ban}
              label="Blacklist"
              value={blacklistCount}
              sublabel="Live"
              tone={blacklistCount > 0 ? 'danger' : 'default'}
              to="/masters/vehicles"
            />
            <StatTile
              icon={Clock3}
              label="Overstay"
              value={overstayedCount}
              sublabel="Live"
              tone={overstayedCount > 0 ? 'danger' : 'default'}
              to="/monitoring/tracking"
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
            <HourlyActivityChart
              activeVehicles={data.activeVehicles}
              history={data.history}
              range={range}
            />
            <GateStatusPanel gates={data.gates} health={data.health} />
          </FadeIn>

          <SectionLabel>Live Operations</SectionLabel>
          <FadeIn delay={240} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ActiveVehiclesPanel
              vehicles={data.activeVehicles}
              history={data.history}
              gates={data.gates}
            />
            <QuickLinksPanel />
          </FadeIn>

          <SectionLabel>Registered Fleet</SectionLabel>
          <FadeIn delay={320} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FleetRegistrationChart
              vehicles={data.authorizedVehicles}
              range={range}
              className="lg:col-span-2"
            />
            <RegisteredFleetChart vehicles={data.authorizedVehicles} />
            <ComplianceOverviewChart vehicles={data.authorizedVehicles} />
          </FadeIn>

          <SectionLabel>Traffic Trends</SectionLabel>
          <FadeIn delay={400} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <WeeklyTrafficChart
              activeVehicles={data.activeVehicles}
              history={data.history}
              range={range}
            />
            <AccessOutcomeDonut
              activeVehicles={data.activeVehicles}
              history={data.history}
              unauthorizedAttempts={data.unauthorizedAttempts}
              range={range}
            />
          </FadeIn>

          <SectionLabel>Alerts & Infrastructure</SectionLabel>
          <FadeIn delay={480} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AlertsPanel
              unauthorizedAttempts={data.unauthorizedAttempts}
              activeVehicles={data.activeVehicles}
              health={data.health}
              gates={data.gates}
            />
            <SystemHealthPanel health={data.health} gates={data.gates} />
          </FadeIn>
        </>
      )}
    </div>
  );
}
