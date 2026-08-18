import PageHeader from '../components/ui/PageHeader';
import CollapsibleSection from '../components/ui/CollapsibleSection';
import NotificationsPanel from '../features/settings/NotificationsPanel';
import MaxVehiclesPerEmployeePanel from '../features/settings/MaxVehiclesPerEmployeePanel';
import EmployeeOverstayLimitPanel from '../features/settings/EmployeeOverstayLimitPanel';
import ImageCaptureModePanel from '../features/settings/ImageCaptureModePanel';
import CameraWebhookUrlPanel from '../features/settings/CameraWebhookUrlPanel';
import DbCredentialsPanel from '../features/settings/DbCredentialsPanel';
import { usePermissions } from '../context/PermissionsContext';

export default function SettingsPage() {
  const { canView } = usePermissions();

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="System configuration" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotificationsPanel />
        <ImageCaptureModePanel />
        <MaxVehiclesPerEmployeePanel />
        <EmployeeOverstayLimitPanel />
      </div>

      {/* Infrastructure-level (DB credentials, camera webhook URL) — gated by
          its own "developer" resource, not "settings", so ordinary settings
          access never exposes it. Hidden outright (not just blocked) for
          anyone without that permission. */}
      {canView('developer') && (
        <CollapsibleSection title="Admin">
          <CameraWebhookUrlPanel />
          <DbCredentialsPanel />
        </CollapsibleSection>
      )}
    </div>
  );
}
