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
import ChartTooltip from './ChartTooltip';
import { getTrafficSeries } from '../../../utils/chartData';
import type { DateRange } from '../../../utils/dateRange';
import type { ActiveVehicle, HistoryRecord } from '../../../types/detection';

const ENTRIES_COLOR = '#10b981';
const EXITS_COLOR = '#2563eb';

interface WeeklyTrafficChartProps {
  activeVehicles: ActiveVehicle[];
  history: HistoryRecord[];
  range: DateRange;
}

export default function WeeklyTrafficChart({ activeVehicles, history, range }: WeeklyTrafficChartProps) {
  const data = getTrafficSeries(activeVehicles, history, range);

  return (
    <Panel title="Traffic Trend" className="lg:col-span-2">
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
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="entriesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ENTRIES_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ENTRIES_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="exitsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXITS_COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={EXITS_COLOR} stopOpacity={0} />
            </linearGradient>
            <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={ENTRIES_COLOR} floodOpacity="0.5" />
            </filter>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
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
            fill="url(#exitsFill)"
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
            fill="url(#entriesFill)"
            dot={{ r: 3, fill: ENTRIES_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            style={{ filter: 'url(#lineGlow)' }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Panel>
  );
}
