import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, ShieldAlert, Clock3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import RangeDropdown from '../../components/ui/RangeDropdown';
import { formatRelativeTime } from '../../utils/format';
import { getRangeForPreset, isWithinRange, type RangePreset } from '../../utils/dateRange';
import type { ActiveVehicle, UnauthorizedAttempt } from '../../types/detection';
import type { SystemHealth } from '../../types/health';
import { formatUnauthorizedReason } from '../liveMonitoring/unauthorizedReason';

interface Alert {
  key: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
}

const SEVERITY_STYLES: Record<Alert['severity'], string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

interface AlertsPanelProps {
  unauthorizedAttempts: UnauthorizedAttempt[];
  activeVehicles: ActiveVehicle[];
  health: SystemHealth | null;
}

export default function AlertsPanel({
  unauthorizedAttempts,
  activeVehicles,
  health,
}: AlertsPanelProps) {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const range = getRangeForPreset(preset, customDate);

  const alerts: Alert[] = [];

  unauthorizedAttempts
    .filter((a) => isWithinRange(a.timestamp, range))
    .forEach((a) => {
      alerts.push({
        key: `unauth-${a.plate_number}-${a.timestamp}`,
        icon: ShieldAlert,
        title: formatUnauthorizedReason(a.reason),
        detail: `${a.plate_number} at ${a.cam_id}`,
        time: a.timestamp,
        severity: 'high',
      });
    });

  activeVehicles
    .filter((v) => v.is_overstayed && isWithinRange(v.last_alert_time ?? v.entry_time, range))
    .forEach((v) => {
      alerts.push({
        key: `overstay-${v.plate_number}-${v.entry_time}`,
        icon: Clock3,
        title: 'Vehicle Overstayed',
        detail: `${v.plate_number} at ${v.cam_id}`,
        time: v.last_alert_time ?? v.entry_time,
        severity: 'medium',
      });
    });

  if (health) {
    Object.entries(health.camera.cameras).forEach(([camId, cam]) => {
      if (cam.status !== 'ok') {
        alerts.push({
          key: `camera-${camId}`,
          icon: AlertTriangle,
          title: 'Camera Offline',
          detail: camId,
          time: cam.last_contact ?? new Date().toISOString(),
          severity: 'high',
        });
      }
    });
    if (health.relays.status !== 'ok') {
      const fault = health.relays.last_fault;
      alerts.push({
        key: 'relays',
        icon: AlertTriangle,
        title: 'Relay Fault',
        detail: fault
          ? `${fault.gate_id ?? 'Gate'} (register ${fault.register}): ${fault.error}`
          : 'Relay board reporting a fault',
        time: fault?.at ?? new Date().toISOString(),
        severity: 'high',
      });
    }
  }

  const sorted = alerts
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return (
    <Panel
      title="Active Alerts"
      action={
        <div className="flex items-center gap-2">
          <RangeDropdown
            preset={preset}
            customDate={customDate}
            onChange={(p, d) => {
              setPreset(p);
              if (d) setCustomDate(d);
            }}
          />
          <Link
            to="/alarms"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      }
    >
      <ul className="space-y-3">
        {sorted.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-400">No active alerts</li>
        )}
        {sorted.map((alert) => {
          const Icon = alert.icon;
          return (
            <li key={alert.key} className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${SEVERITY_STYLES[alert.severity]}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{alert.title}</p>
                <p className="truncate text-xs text-slate-500">{alert.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {formatRelativeTime(alert.time)}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
