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
import { getFleetRegistrationSeries } from '../../../utils/chartData';
import type { DateRange } from '../../../utils/dateRange';
import type { AuthorizedVehicle } from '../../../types/authorizedVehicle';

const WHITELIST_COLOR = '#10b981';
const BLACKLIST_COLOR = '#ef4444';

interface FleetRegistrationChartProps {
  vehicles: AuthorizedVehicle[];
  range: DateRange;
  className?: string;
}

export default function FleetRegistrationChart({
  vehicles,
  range,
  className,
}: FleetRegistrationChartProps) {
  const data = getFleetRegistrationSeries(vehicles, range);
  const total = vehicles.length;

  return (
    <Panel
      title="Whitelist vs Blacklist Trend"
      className={className}
      badge={
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {total} total
        </span>
      }
    >
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: WHITELIST_COLOR }} />
          Whitelist
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BLACKLIST_COLOR }} />
          Blacklist
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="whitelistFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={WHITELIST_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={WHITELIST_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="blacklistFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLACKLIST_COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BLACKLIST_COLOR} stopOpacity={0} />
            </linearGradient>
            <filter id="fleetLineGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={WHITELIST_COLOR} floodOpacity="0.5" />
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
                    name: p.name === 'whitelist' ? 'Whitelist' : 'Blacklist',
                    value: Number(p.value ?? 0),
                    color: p.name === 'whitelist' ? WHITELIST_COLOR : BLACKLIST_COLOR,
                  })) ?? []
                }
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="blacklist"
            stroke={BLACKLIST_COLOR}
            strokeWidth={2.5}
            fill="url(#blacklistFill)"
            dot={{ r: 3, fill: BLACKLIST_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="whitelist"
            stroke={WHITELIST_COLOR}
            strokeWidth={2.5}
            fill="url(#whitelistFill)"
            dot={{ r: 3, fill: WHITELIST_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            style={{ filter: 'url(#fleetLineGlow)' }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Panel>
  );
}
