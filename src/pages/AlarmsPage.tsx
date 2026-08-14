import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import StatTile from '../features/dashboard/StatTile';
import { SkeletonList, SkeletonStatTiles } from '../components/ui/Skeleton';
import {
  alarmExtraFields,
  alarmSeverity,
  alarmTarget,
  alarmTimestamp,
  alarmTitle,
} from '../features/alarms/readAlarmField';
import { getAlarms } from '../services/alarmsService';
import { useInterval } from '../hooks/useInterval';
import { formatRelativeTime } from '../utils/format';
import type { AlarmsResponse } from '../types/alarms';

const POLL_MS = 3000;

export default function AlarmsPage() {
  const [data, setData] = useState<AlarmsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getAlarms();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alarms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, POLL_MS);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alarms & Events"
        description="Conditions that are true right now — clears automatically once resolved"
      />

      {loading ? (
        <>
          <SkeletonStatTiles count={2} gridClassName="grid grid-cols-2 gap-3 sm:max-w-md" />
          <Panel title="Active Alarms">
            <SkeletonList rows={3} />
          </Panel>
        </>
      ) : error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <StatTile
              icon={AlertTriangle}
              label="Critical"
              value={data.critical_count}
              tone={data.critical_count > 0 ? 'danger' : 'default'}
            />
            <StatTile
              icon={ShieldAlert}
              label="Warning"
              value={data.warning_count}
              tone={data.warning_count > 0 ? 'warning' : 'default'}
            />
          </div>

          <Panel title="Active Alarms">
            {data.alarms.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No active alarms — all clear
              </p>
            ) : (
              <ul className="space-y-3">
                {data.alarms.map((alarm, idx) => {
                  const severity = alarmSeverity(alarm);
                  const target = alarmTarget(alarm);
                  const timestamp = alarmTimestamp(alarm);
                  const extras = alarmExtraFields(alarm);
                  return (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          severity === 'critical'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              severity === 'critical'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {severity}
                          </span>
                          <p className="text-sm font-medium text-slate-900">
                            {alarmTitle(alarm)}
                          </p>
                        </div>
                        {target && <p className="mt-1 text-xs text-slate-500">{target}</p>}
                        {extras.length > 0 && (
                          <p className="mt-1 text-xs text-slate-400">
                            {extras.map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                          </p>
                        )}
                      </div>
                      {timestamp && (
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatRelativeTime(timestamp)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
