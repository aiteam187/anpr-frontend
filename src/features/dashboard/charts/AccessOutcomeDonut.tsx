import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Panel from '../../../components/ui/Panel';
import RangeDropdown from '../../../components/ui/RangeDropdown';
import ChartTooltip from './ChartTooltip';
import { getAccessOutcome } from '../../../utils/chartData';
import { getRangeForPreset, type RangePreset } from '../../../utils/dateRange';
import type { ActiveVehicle, HistoryRecord, UnauthorizedAttempt } from '../../../types/detection';

const COLORS: Record<string, string> = {
  Authorized: '#10b981',
  Unauthorized: '#ef4444',
};

interface AccessOutcomeDonutProps {
  activeVehicles: ActiveVehicle[];
  history: HistoryRecord[];
  unauthorizedAttempts: UnauthorizedAttempt[];
}

export default function AccessOutcomeDonut({
  activeVehicles,
  history,
  unauthorizedAttempts,
}: AccessOutcomeDonutProps) {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const range = getRangeForPreset(preset, customDate);
  const data = getAccessOutcome(activeVehicles, history, unauthorizedAttempts, range);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);

  return (
    <Panel
      title="Access Outcomes"
      action={
        <RangeDropdown
          preset={preset}
          customDate={customDate}
          onChange={(p, d) => {
            setPreset(p);
            if (d) setCustomDate(d);
          }}
        />
      }
    >
      {total === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-400">No activity recorded in this period</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  <filter id="donutGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#1e293b" floodOpacity="0.15" />
                  </filter>
                </defs>
                <Pie
                  data={nonZero}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={nonZero.length > 1 ? 3 : 0}
                  strokeWidth={0}
                  cornerRadius={6}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#cbd5e1' }}
                  style={{ filter: 'url(#donutGlow)' }}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {nonZero.map((slice) => (
                    <Cell key={slice.name} fill={COLORS[slice.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => (
                    <ChartTooltip
                      active={active}
                      items={
                        payload?.map((p) => ({
                          name: String(p.name),
                          value: Number(p.value ?? 0),
                          color: COLORS[String(p.name)] ?? '#94a3b8',
                        })) ?? []
                      }
                    />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold text-slate-900">{total}</p>
              <p className="text-xs text-slate-400">total</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            {data.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[d.name] ?? '#94a3b8' }}
                />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
