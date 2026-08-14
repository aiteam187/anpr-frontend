import { useEffect, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Panel from '../../../components/ui/Panel';
import RangeDropdown from '../../../components/ui/RangeDropdown';
import { SkeletonChart } from '../../../components/ui/Skeleton';
import ChartTooltip from '../../dashboard/charts/ChartTooltip';
import { getAnalyticsSummary } from '../../../services/analyticsService';
import { getRangeForPreset, toApiDateRange, type RangePreset } from '../../../utils/dateRange';

const ENTRIES_COLOR = '#10b981';
const EXITS_COLOR = '#2563eb';

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function TrafficByDayChart() {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const [chartData, setChartData] = useState<{ label: string; entries: number; exits: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeForPreset(preset, customDate);
    let cancelled = false;
    setLoading(true);
    getAnalyticsSummary(toApiDateRange(range))
      .then((res) => {
        if (cancelled) return;
        setChartData(res.traffic_by_day.map((d) => ({ ...d, label: formatDayLabel(d.date) })));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load traffic by day');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preset, customDate]);

  return (
    <Panel
      title="Traffic by Day"
      className="lg:col-span-2"
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
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ENTRIES_COLOR }} />
          Entries
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXITS_COLOR }} />
          Exits
        </span>
      </div>
      {loading ? (
        <SkeletonChart />
      ) : error ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-red-600">{error}</div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
          No traffic in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dayEntriesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ENTRIES_COLOR} stopOpacity={0.28} />
                <stop offset="100%" stopColor={ENTRIES_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dayExitsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXITS_COLOR} stopOpacity={0.22} />
                <stop offset="100%" stopColor={EXITS_COLOR} stopOpacity={0} />
              </linearGradient>
              <filter id="dayLineGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={ENTRIES_COLOR} floodOpacity="0.5" />
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  items={
                    payload?.map((p) => ({
                      name: p.name === 'entries' ? 'Entries' : 'Exits',
                      value: Number(p.value ?? 0),
                      color: p.name === 'entries' ? ENTRIES_COLOR : EXITS_COLOR,
                    })) ?? []
                  }
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="exits"
              stroke={EXITS_COLOR}
              strokeWidth={2.5}
              fill="url(#dayExitsFill)"
              dot={{ r: 3, fill: EXITS_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="entries"
              stroke={ENTRIES_COLOR}
              strokeWidth={2.5}
              fill="url(#dayEntriesFill)"
              dot={{ r: 3, fill: ENTRIES_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              style={{ filter: 'url(#dayLineGlow)' }}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}
