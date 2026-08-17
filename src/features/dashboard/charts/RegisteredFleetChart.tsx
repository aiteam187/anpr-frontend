import { useEffect, useState } from 'react';
import Panel from '../../../components/ui/Panel';
import type { AuthorizedVehicle } from '../../../types/authorizedVehicle';

interface TypeSlice {
  key: string;
  label: string;
  count: number;
  color: string;
  glow: string;
}

// vehicle_type is admin-configurable via the Vehicle Type Master
// (GET/POST /admin/vehicle-types) — a free-form list, not a fixed enum —
// so this groups by whatever string is actually stored (e.g. "2 WHEELER",
// "4 WHEELER") instead of a hardcoded key match, which previously expected
// values like "bike"/"car" that the app never actually saves anywhere,
// silently bucketing every single vehicle into "Other".
const PALETTE = [
  { color: '#2563eb', glow: '#60a5fa' },
  { color: '#10b981', glow: '#6ee7b7' },
  { color: '#f59e0b', glow: '#fcd34d' },
  { color: '#7c3aed', glow: '#c4b5fd' },
  { color: '#0891b2', glow: '#67e8f9' },
  { color: '#e11d48', glow: '#fda4af' },
];

function buildSlices(vehicles: AuthorizedVehicle[]): TypeSlice[] {
  const counts = new Map<string, number>();
  vehicles.forEach((v) => {
    const label = v.vehicle_type?.trim() || 'Not Specified';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], i) => ({
      key: label,
      label,
      count,
      ...PALETTE[i % PALETTE.length],
    }));
}

interface RegisteredFleetChartProps {
  vehicles: AuthorizedVehicle[];
}

export default function RegisteredFleetChart({ vehicles }: RegisteredFleetChartProps) {
  const slices = buildSlices(vehicles);
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const maxCount = Math.max(...slices.map((s) => s.count), 1);

  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <Panel
      title="Registered Fleet by Vehicle Type"
      badge={
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {total} total
        </span>
      }
    >
      {total === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
          No vehicle type data recorded yet
        </div>
      ) : (
        <div className="space-y-5 py-1">
          {slices.map((s) => {
            const pct = Math.round((s.count / maxCount) * 100);
            const share = total === 0 ? 0 : Math.round((s.count / total) * 100);
            return (
              <div key={s.key} className="group">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-700">{s.label}</span>
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold tabular-nums text-slate-900">{s.count}</span>
                    <span className="text-xs font-medium text-slate-400">{share}%</span>
                  </span>
                </div>
                <div className="relative h-[2px] w-full rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: grown ? `${pct}%` : '0%',
                      background: `linear-gradient(90deg, ${s.glow}, ${s.color})`,
                    }}
                  />
                  <span
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ring-2 ring-white transition-all duration-700 ease-out"
                    style={{
                      left: grown ? `${pct}%` : '0%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: s.color,
                      boxShadow: `0 0 10px 1px ${s.glow}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
