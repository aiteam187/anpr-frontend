import { useCallback, useEffect, useState } from 'react';
import { Camera, Database, Mail, Server, Zap } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import { SkeletonList, SkeletonTable } from '../components/ui/Skeleton';
import { getSystemHealth } from '../services/healthService';
import { getGates } from '../services/gatesService';
import { useInterval } from '../hooks/useInterval';
import { formatRelativeTime } from '../utils/format';
import type { SystemHealth } from '../types/health';
import type { GateConfig } from '../types/gate';

const POLL_MS = 3000;

function StatusPill({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {ok ? okLabel : badLabel}
    </span>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [gates, setGates] = useState<GateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [healthRes, gatesRes] = await Promise.all([getSystemHealth(), getGates()]);
      setHealth(healthRes);
      setGates(gatesRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, POLL_MS);

  const cameraEntries = health ? Object.entries(health.camera.cameras) : [];
  const gateByCameraId = new Map(gates.filter((g) => g.enabled).map((g) => [g.camera_id, g]));

  return (
    <div className="space-y-4">
      <PageHeader title="System Health" description="Live infrastructure status" />

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Panel key={i} title="—">
                <SkeletonList rows={1} />
              </Panel>
            ))}
          </div>
          <Panel title="Cameras">
            <SkeletonTable columns={4} rows={2} />
          </Panel>
        </>
      ) : error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : health ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Panel title="Database">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Database className="h-4 w-4" />
                </div>
                <StatusPill ok={health.database === 'ok'} okLabel="Connected" badLabel="Unreachable" />
              </div>
            </Panel>
            <Panel title="Scheduler">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Server className="h-4 w-4" />
                </div>
                <StatusPill ok={health.scheduler_running} okLabel="Running" badLabel="Stopped" />
              </div>
            </Panel>
            <Panel title="Relays">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Zap className="h-4 w-4" />
                </div>
                <StatusPill ok={health.relays.status === 'ok'} okLabel="OK" badLabel="Fault" />
              </div>
              {health.relays.last_fault && (
                <p className="mt-2 text-xs text-red-600">
                  {health.relays.last_fault.gate_id ?? 'Gate'} (register{' '}
                  {health.relays.last_fault.register}): {health.relays.last_fault.error}
                </p>
              )}
              {health.relays.consecutive_failures > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {health.relays.consecutive_failures} consecutive failures
                </p>
              )}
            </Panel>
            <Panel title="Alerts">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Mail className="h-4 w-4" />
                </div>
                <StatusPill
                  ok={!health.email_alerts.alert_escalated}
                  okLabel="Healthy"
                  badLabel="Escalated"
                />
              </div>
              {health.email_alerts.consecutive_failures > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {health.email_alerts.consecutive_failures} consecutive failures
                </p>
              )}
            </Panel>
          </div>

          <Panel title="Cameras">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="pb-2 font-medium">Camera</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Last Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {cameraEntries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No cameras reporting
                      </td>
                    </tr>
                  )}
                  {cameraEntries.map(([camId, cam]) => {
                    const gate = gateByCameraId.get(camId);
                    return (
                      <tr key={camId} className="border-t border-slate-200">
                        <td className="py-2.5 font-medium text-slate-900">
                          {gate ? `${gate.gate_name} (${gate.direction})` : camId}
                        </td>
                        <td className="py-2.5">
                          <StatusPill ok={cam.status === 'ok'} okLabel="Online" badLabel="Offline" />
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {cam.last_contact ? formatRelativeTime(cam.last_contact) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          {cameraEntries.length === 0 && (
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Camera className="h-3.5 w-3.5" />
              Cameras only appear here once they&apos;ve sent at least one heartbeat.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
