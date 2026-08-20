import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Panel from '../../../components/ui/Panel';
import RangeDropdown from '../../../components/ui/RangeDropdown';
import { SkeletonChart } from '../../../components/ui/Skeleton';
import ChartTooltip from '../../dashboard/charts/ChartTooltip';
import { getAnalyticsSummary } from '../../../services/analyticsService';
import { getRangeForPreset, toApiDateRange, type RangePreset } from '../../../utils/dateRange';
import type { VehicleTypeCount } from '../../../types/analytics';

const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#7c3aed', '#ef4444', '#0891b2'];
const MAX_SLICES = 6;

function foldToOther(data: VehicleTypeCount[]): VehicleTypeCount[] {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  if (sorted.length <= MAX_SLICES) return sorted;
  const top = sorted.slice(0, MAX_SLICES - 1);
  const rest = sorted.slice(MAX_SLICES - 1);
  const otherCount = rest.reduce((sum, d) => sum + d.count, 0);
  return [...top, { vehicle_type: 'other', count: otherCount }];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function VehicleTypeDonut() {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const [data, setData] = useState<VehicleTypeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeForPreset(preset, customDate);
    let cancelled = false;
    setLoading(true);
    getAnalyticsSummary(toApiDateRange(range))
      .then((res) => {
        if (cancelled) return;
        setData(res.vehicle_type_distribution);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load vehicle type distribution');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preset, customDate]);

  const slices = foldToOther(data);
  const total = slices.reduce((sum, d) => sum + d.count, 0);

  return (
    <Panel
      title="Vehicle Type Distribution"
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
      {loading ? (
        <SkeletonChart />
      ) : error ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-red-600">{error}</div>
      ) : total === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
          No vehicle type data recorded
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  <filter id="donutAnalyticsGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.18" />
                  </filter>
                </defs>
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="vehicle_type"
                  innerRadius={62}
                  outerRadius={92}
                  cornerRadius={6}
                  paddingAngle={slices.length > 1 ? 3 : 0}
                  strokeWidth={0}
                  style={{ filter: 'url(#donutAnalyticsGlow)' }}
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  {slices.map((slice, i) => (
                    <Cell key={slice.vehicle_type} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => (
                    <ChartTooltip
                      active={active}
                      items={
                        payload?.map((p, i) => ({
                          name: capitalize(String(p.name)),
                          value: Number(p.value ?? 0),
                          color: PALETTE[i % PALETTE.length],
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
            {slices.map((s, i) => (
              <span key={s.vehicle_type} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                {capitalize(s.vehicle_type)} ({s.count})
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
