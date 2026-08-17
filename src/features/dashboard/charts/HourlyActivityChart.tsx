import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import Panel from '../../../components/ui/Panel';
import ChartTooltip from './ChartTooltip';
import { getHourlyPattern } from '../../../utils/chartData';
import type { DateRange } from '../../../utils/dateRange';
import type { ActiveVehicle, HistoryRecord } from '../../../types/detection';

const COLOR = '#2563eb';

interface HourlyActivityChartProps {
  activeVehicles: ActiveVehicle[];
  history: HistoryRecord[];
  range: DateRange;
}

export default function HourlyActivityChart({ activeVehicles, history, range }: HourlyActivityChartProps) {
  const data = getHourlyPattern(activeVehicles, history, range);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Panel title="Activity by Time of Day" className="lg:col-span-2">
      <p className="mb-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">{total}</span> entries in this period
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.25} />
              <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
            </linearGradient>
            <filter id="hourlyGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={COLOR} floodOpacity="0.45" />
            </filter>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
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
                items={[{ name: 'Vehicles', value: Number(payload?.[0]?.value ?? 0), color: COLOR }]}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={COLOR}
            strokeWidth={2.5}
            fill="url(#hourlyFill)"
            dot={false}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            style={{ filter: 'url(#hourlyGlow)' }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}
