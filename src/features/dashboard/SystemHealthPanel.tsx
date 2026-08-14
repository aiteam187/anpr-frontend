import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { formatRelativeTime } from '../../utils/format';
import type { SystemHealth } from '../../types/health';

interface SystemHealthPanelProps {
  health: SystemHealth | null;
}

const viewAllAction = (
  <Link
    to="/system-health"
    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
  >
    View all
    <ChevronRight className="h-3.5 w-3.5" />
  </Link>
);

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
    />
  );
}

export default function SystemHealthPanel({ health }: SystemHealthPanelProps) {
  if (!health) {
    return (
      <Panel title="System Health" action={viewAllAction}>
        <p className="text-sm text-slate-400">Unable to reach health endpoint</p>
      </Panel>
    );
  }

  const cameras = Object.entries(health.camera.cameras);

  return (
    <Panel title="System Health" action={viewAllAction}>
      <ul className="space-y-2.5 text-sm">
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-700">
            <StatusDot ok={health.database === 'ok'} />
            Database
          </span>
          <span className="text-slate-500">{health.database}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-700">
            <StatusDot ok={health.scheduler_running} />
            Scheduler
          </span>
          <span className="text-slate-500">
            {health.scheduler_running ? 'Running' : 'Stopped'}
          </span>
        </li>
        {cameras.map(([camId, cam]) => (
          <li key={camId} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-700">
              <StatusDot ok={cam.status === 'ok'} />
              Camera {camId}
            </span>
            <span className="text-slate-500">{formatRelativeTime(cam.last_contact)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-700">
            <StatusDot ok={health.relays.status === 'ok'} />
            Relays
          </span>
          <span className="text-slate-500">{health.relays.status}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-700">
            <StatusDot ok={!health.email_alerts.alert_escalated} />
            Alerts
          </span>
          <span className="text-slate-500">
            {health.email_alerts.consecutive_failures} failures
          </span>
        </li>
      </ul>
    </Panel>
  );
}
