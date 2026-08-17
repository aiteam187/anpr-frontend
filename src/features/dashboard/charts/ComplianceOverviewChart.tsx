import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { FileCheck2, IdCard, ShieldCheck, type LucideIcon } from 'lucide-react';
import Panel from '../../../components/ui/Panel';
import { isPastDate } from '../../../utils/validation';
import type { AuthorizedVehicle } from '../../../types/authorizedVehicle';

interface ComplianceRow {
  key: string;
  name: string;
  valid: number;
  expired: number;
  pct: number;
  color: string;
  soft: string;
  fillId: string;
  icon: LucideIcon;
  points: { stage: string; count: number }[];
}

/** Active (whitelist/visitor) vehicles only — a blacklisted vehicle's paperwork status isn't an operational concern. */
function activeFleet(vehicles: AuthorizedVehicle[]): AuthorizedVehicle[] {
  return vehicles.filter((v) => v.is_active && v.list_type !== 'blacklist');
}

function buildRows(vehicles: AuthorizedVehicle[]): { fleetSize: number; rows: ComplianceRow[]; compliantPct: number } {
  const fleet = activeFleet(vehicles);
  const fleetSize = fleet.length;

  const build = (
    key: string,
    name: string,
    field: keyof AuthorizedVehicle,
    color: string,
    soft: string,
    fillId: string,
    icon: LucideIcon,
  ): ComplianceRow => {
    const expired = fleet.filter((v) => isPastDate(v[field] as string | null)).length;
    const valid = fleetSize - expired;
    return {
      key,
      name,
      valid,
      expired,
      pct: fleetSize === 0 ? 0 : Math.round((valid / fleetSize) * 100),
      color,
      soft,
      fillId,
      icon,
      points: [
        { stage: 'Start', count: 0 },
        { stage: 'Expired', count: expired },
        { stage: 'Valid', count: valid },
      ],
    };
  };

  const rows = [
    build('insurance', 'Insurance', 'insurance_validity', '#2563eb', '#eff6ff', 'fillInsurance', ShieldCheck),
    build('puc', 'PUC', 'puc_validity', '#10b981', '#ecfdf5', 'fillPuc', FileCheck2),
    build('license', 'License', 'license_validity', '#f59e0b', '#fffbeb', 'fillLicense', IdCard),
  ];

  const fullyCompliant = fleet.filter(
    (v) => !isPastDate(v.insurance_validity) && !isPastDate(v.puc_validity) && !isPastDate(v.license_validity),
  ).length;
  const compliantPct = fleetSize === 0 ? 0 : Math.round((fullyCompliant / fleetSize) * 100);

  return { fleetSize, rows, compliantPct };
}

interface ComplianceOverviewChartProps {
  vehicles: AuthorizedVehicle[];
}

export default function ComplianceOverviewChart({ vehicles }: ComplianceOverviewChartProps) {
  const { fleetSize, rows, compliantPct } = buildRows(vehicles);
  const expiredTotal = rows.reduce((sum, r) => sum + r.expired, 0);

  return (
    <Panel
      title="Compliance Overview"
      badge={
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            expiredTotal > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {expiredTotal > 0 ? `${expiredTotal} expired doc${expiredTotal === 1 ? '' : 's'}` : 'All clear'}
        </span>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
          <ShieldCheck className="h-5 w-5 text-white" />
        </span>
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {fleetSize === 0 ? '—' : `${compliantPct}%`}
          <span className="ml-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
            fully compliant fleet
          </span>
        </p>
      </div>

      {fleetSize === 0 ? (
        <div className="flex h-[150px] items-center justify-center text-sm text-slate-400">
          No active vehicles to check compliance for
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.key}
                className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                style={{ backgroundColor: r.soft }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm"
                  style={{ backgroundColor: r.color }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <div className="w-20 shrink-0">
                  <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                  <p className="text-xs font-medium" style={{ color: r.color }}>
                    {r.pct}%{r.expired > 0 ? ` · ${r.expired} exp.` : ''}
                  </p>
                </div>
                <div className="h-14 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={r.points} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
                      <defs>
                        <linearGradient id={r.fillId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={r.color} stopOpacity={0.55} />
                          <stop offset="100%" stopColor={r.color} stopOpacity={0.02} />
                        </linearGradient>
                        <filter id={`glow-${r.key}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={r.color} floodOpacity="0.5" />
                        </filter>
                      </defs>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload as { stage: string; count: number };
                          if (p.stage === 'Start') return null;
                          return (
                            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg">
                              <span className="font-medium text-slate-900">{p.stage}: </span>
                              <span style={{ color: r.color }}>{p.count}</span>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={r.color}
                        strokeWidth={3}
                        fill={`url(#${r.fillId})`}
                        dot={{ r: 3.5, fill: '#ffffff', stroke: r.color, strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: r.color }}
                        style={{ filter: `url(#glow-${r.key})` }}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
