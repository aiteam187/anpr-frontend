import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import RequirePermission from '../components/auth/RequirePermission';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const GatesPage = lazy(() => import('../pages/GatesPage'));
const VisitorsPage = lazy(() => import('../pages/VisitorsPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const MonitoringLivePage = lazy(() => import('../pages/MonitoringLivePage'));
const MonitoringTrackingPage = lazy(() => import('../pages/MonitoringTrackingPage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const RoleMasterPage = lazy(() => import('../pages/RoleMasterPage'));
const ActivityLogPage = lazy(() => import('../pages/ActivityLogPage'));
const AlarmsPage = lazy(() => import('../pages/AlarmsPage'));
const SystemHealthPage = lazy(() => import('../pages/SystemHealthPage'));
const EmployeeMasterPage = lazy(() => import('../pages/EmployeeMasterPage'));
const VehicleMasterPage = lazy(() => import('../pages/VehicleMasterPage'));

function RouteFallback() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="mb-2 h-6 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<RequirePermission resource="dashboard"><DashboardPage /></RequirePermission>} />
        <Route path="/live-monitoring" element={<Navigate to="/monitoring/live" replace />} />
        <Route path="/monitoring" element={<Navigate to="/monitoring/live" replace />} />
        <Route path="/monitoring/live" element={<RequirePermission resource="monitoring"><MonitoringLivePage /></RequirePermission>} />
        <Route path="/monitoring/tracking" element={<RequirePermission resource="monitoring"><MonitoringTrackingPage /></RequirePermission>} />
        <Route path="/vehicle-search" element={<Navigate to="/masters/vehicles" replace />} />
        <Route path="/management" element={<Navigate to="/masters/vehicles" replace />} />
        <Route path="/management/whitelist" element={<Navigate to="/masters/vehicles" replace />} />
        <Route path="/management/blacklist" element={<Navigate to="/masters/vehicles" replace />} />
        <Route path="/masters" element={<Navigate to="/masters/employees" replace />} />
        <Route path="/masters/employees" element={<RequirePermission resource="masters"><EmployeeMasterPage /></RequirePermission>} />
        <Route path="/masters/vehicles" element={<RequirePermission resource="masters"><VehicleMasterPage /></RequirePermission>} />
        <Route path="/masters/visitors" element={<RequirePermission resource="masters"><VisitorsPage /></RequirePermission>} />
        <Route path="/visitors" element={<Navigate to="/masters/visitors" replace />} />
        <Route path="/masters/gates" element={<RequirePermission resource="masters"><GatesPage /></RequirePermission>} />
        <Route path="/gates" element={<Navigate to="/masters/gates" replace />} />
        <Route path="/reports" element={<RequirePermission resource="reports"><ReportsPage /></RequirePermission>} />
        <Route path="/analytics" element={<RequirePermission resource="analytics"><AnalyticsPage /></RequirePermission>} />
        <Route path="/alarms" element={<RequirePermission resource="alarms"><AlarmsPage /></RequirePermission>} />
        <Route path="/system-health" element={<RequirePermission resource="system_health"><SystemHealthPage /></RequirePermission>} />
        <Route path="/users" element={<Navigate to="/users/accounts" replace />} />
        <Route path="/users/accounts" element={<RequirePermission resource="users"><UsersPage /></RequirePermission>} />
        <Route path="/users/roles" element={<RequirePermission resource="users"><RoleMasterPage /></RequirePermission>} />
        <Route path="/audit-logs" element={<RequirePermission resource="audit_logs"><ActivityLogPage /></RequirePermission>} />
        <Route path="/settings" element={<RequirePermission resource="settings"><SettingsPage /></RequirePermission>} />
      </Routes>
    </Suspense>
  );
}
