import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import Panel from '../../../components/ui/Panel';
import RangeDropdown from '../../../components/ui/RangeDropdown';
import { SkeletonChart } from '../../../components/ui/Skeleton';
import ChartTooltip from '../../dashboard/charts/ChartTooltip';
import { getAnalyticsSummary } from '../../../services/analyticsService';
import { getRangeForPreset, toApiDateRange, type RangePreset } from '../../../utils/dateRange';

const COLOR = '#2563eb';

export default function TrafficByHourChart() {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const [chartData, setChartData] = useState<{ label: string; entries: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeForPreset(preset, customDate);
    let cancelled = false;
    setLoading(true);
    getAnalyticsSummary(toApiDateRange(range))
      .then((res) => {
        if (cancelled) return;
        setChartData(
          res.traffic_by_hour.map((d) => ({
            label: `${d.hour.toString().padStart(2, '0')}:00`,
            entries: d.entries,
          })),
        );
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load traffic by hour');
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
      title="Traffic by Hour of Day"
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
      <p className="mb-3 text-xs text-slate-500">Entries aggregated across the selected period</p>
      {loading ? (
        <SkeletonChart />
      ) : error ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-red-600">{error}</div>
      ) : chartData.every((d) => d.entries === 0) ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
          No traffic in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hourlyAnalyticsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR} stopOpacity={0.24} />
                <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
              </linearGradient>
              <filter id="hourlyAnalyticsGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={COLOR} floodOpacity="0.45" />
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval={3}
            />
            <Tooltip
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  items={[{ name: 'Entries', value: Number(payload?.[0]?.value ?? 0), color: COLOR }]}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="entries"
              stroke={COLOR}
              strokeWidth={2.5}
              fill="url(#hourlyAnalyticsFill)"
              dot={false}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              style={{ filter: 'url(#hourlyAnalyticsGlow)' }}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}
