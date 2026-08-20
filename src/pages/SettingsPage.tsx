import PageHeader from '../components/ui/PageHeader';
import CollapsibleSection from '../components/ui/CollapsibleSection';
import NotificationsPanel from '../features/settings/NotificationsPanel';
import MaxVehiclesPerEmployeePanel from '../features/settings/MaxVehiclesPerEmployeePanel';
import EmployeeOverstayLimitPanel from '../features/settings/EmployeeOverstayLimitPanel';
import ImageCaptureModePanel from '../features/settings/ImageCaptureModePanel';
import ImageStorageDirPanel from '../features/settings/ImageStorageDirPanel';
import CameraWebhookUrlPanel from '../features/settings/CameraWebhookUrlPanel';
import DbCredentialsPanel from '../features/settings/DbCredentialsPanel';
import BackupPanel from '../features/settings/BackupPanel';
import { usePermissions } from '../context/PermissionsContext';

export default function SettingsPage() {
  const { canView, role } = usePermissions();
  // Backup is a system-level action restricted to administrator/developer
  // specifically (mirrors the backend's require_admin_or_developer) —
  // not gated by the general 'settings' permission, since a real disk
  // backup operation shouldn't become grantable to an arbitrary role just
  // by ticking a box in the permissions UI.
  const canBackup = role === 'administrator' || role === 'developer';

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="System configuration" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotificationsPanel />
        <ImageCaptureModePanel />
        <ImageStorageDirPanel />
        <MaxVehiclesPerEmployeePanel />
        <EmployeeOverstayLimitPanel />
        {canBackup && <BackupPanel />}
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
