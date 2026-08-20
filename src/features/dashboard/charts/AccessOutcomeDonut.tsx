import { useRef } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Panel from '../../../components/ui/Panel';
import ChartTooltip from './ChartTooltip';
import { getAccessOutcome } from '../../../utils/chartData';
import type { DateRange } from '../../../utils/dateRange';
import type { ActiveVehicle, HistoryRecord, UnauthorizedAttempt } from '../../../types/detection';

const COLORS: Record<string, string> = {
  Authorized: '#10b981',
  Unauthorized: '#ef4444',
};

interface AccessOutcomeDonutProps {
  activeVehicles: ActiveVehicle[];
  history: HistoryRecord[];
  unauthorizedAttempts: UnauthorizedAttempt[];
  range: DateRange;
}

export default function AccessOutcomeDonut({
  activeVehicles,
  history,
  unauthorizedAttempts,
  range,
}: AccessOutcomeDonutProps) {
  const data = getAccessOutcome(activeVehicles, history, unauthorizedAttempts, range);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);

  // The dashboard polls every 1.5s, and recharts' Pie replays its full
  // shrink-to-zero-and-regrow entrance animation on every data change by
  // default — at that refresh rate it reads as a constant blink rather
  // than a chart update. Play it once (the first time there's data to
  // show), then update in place on every later poll.
  const hasAnimatedRef = useRef(false);
  const shouldAnimate = !hasAnimatedRef.current;
  if (total > 0) hasAnimatedRef.current = true;

  return (
    <Panel title="Access Outcomes">
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
                  isAnimationActive={shouldAnimate}
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
