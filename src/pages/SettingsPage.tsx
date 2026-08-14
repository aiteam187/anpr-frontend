import PageHeader from '../components/ui/PageHeader';
import NotificationsPanel from '../features/settings/NotificationsPanel';
import MaxVehiclesPerEmployeePanel from '../features/settings/MaxVehiclesPerEmployeePanel';
import EmployeeOverstayLimitPanel from '../features/settings/EmployeeOverstayLimitPanel';
import ImageCaptureModePanel from '../features/settings/ImageCaptureModePanel';

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="System configuration" />

      <NotificationsPanel />
      <ImageCaptureModePanel />
      <MaxVehiclesPerEmployeePanel />
      <EmployeeOverstayLimitPanel />
    </div>
  );
}
