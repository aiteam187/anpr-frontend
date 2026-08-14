import { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  Car,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import FadeIn from '../components/ui/FadeIn';
import StatTile from '../features/dashboard/StatTile';
import { SkeletonStatTiles } from '../components/ui/Skeleton';
import { inputClass } from '../components/ui/FormField';
import TrafficByDayChart from '../features/analytics/charts/TrafficByDayChart';
import TrafficByHourChart from '../features/analytics/charts/TrafficByHourChart';
import VehicleTypeDonut from '../features/analytics/charts/VehicleTypeDonut';
import { getAnalyticsSummary } from '../services/analyticsService';
import type { AnalyticsSummary } from '../types/analytics';

type Preset = 'today' | '7d' | '30d' | 'custom';

function presetRange(preset: Preset): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now);
  if (preset === 'today') {
    // start stays as today
  } else if (preset === '7d') {
    start.setDate(start.getDate() - 6);
  } else if (preset === '30d') {
    start.setDate(start.getDate() - 29);
  }
  return { start: start.toISOString().slice(0, 10), end };
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('today');
  const initial = presetRange('today');
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const res = await getAnalyticsSummary({
        start_date: `${start}T00:00:00`,
        end_date: `${end}T23:59:59`,
      });
      setSummary(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === 'custom') return;
    const range = presetRange(p);
    setStartDate(range.start);
    setEndDate(range.end);
    refresh(range.start, range.end);
  };

  const applyCustomRange = () => {
    setPreset('custom');
    refresh(startDate, endDate);
  };

  const confidenceLabel =
    summary?.avg_recognition_confidence_pct != null
      ? `${summary.avg_recognition_confidence_pct.toFixed(1)}%`
      : '—';
  const peakHourLabel = summary?.peak_hour
    ? `${summary.peak_hour.hour.toString().padStart(2, '0')}:00`
    : '—';

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics" description="Traffic trends and access patterns" />

      <Panel
        title="Date Range — Key Metrics"
        badge={
          <span className="text-xs font-normal text-slate-400">
            Charts below have their own filters
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {(['today', '7d', '30d'] as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                preset === p
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              type="button"
              onClick={applyCustomRange}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Apply
            </button>
          </div>
        </div>
      </Panel>

      {loading ? (
        <SkeletonStatTiles count={6} gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4" />
      ) : error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : summary ? (
        <>
          <FadeIn>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              <StatTile icon={LogIn} label="Entries" value={summary.totals.entries} tone="success" />
              <StatTile icon={LogOut} label="Exits" value={summary.totals.exits} />
              <StatTile icon={Car} label="Currently Inside" value={summary.totals.currently_inside} />
              <StatTile
                icon={ShieldAlert}
                label="Unauthorized Attempts"
                value={summary.totals.unauthorized_attempts}
                tone={summary.totals.unauthorized_attempts > 0 ? 'danger' : 'default'}
              />
              <StatTile
                icon={Ban}
                label="Blacklisted Attempts"
                value={summary.totals.blacklisted_attempts}
                tone={summary.totals.blacklisted_attempts > 0 ? 'danger' : 'default'}
              />
              <StatTile icon={ShieldCheck} label="Avg Confidence" value={confidenceLabel} tone="success" />
            </div>
          </FadeIn>

          {summary.peak_hour && (
            <FadeIn delay={80}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Peak hour in this period: <span className="font-semibold text-slate-900">{peakHourLabel}</span>
                <span className="text-slate-400">
                  ({summary.peak_hour.count} {summary.peak_hour.count === 1 ? 'vehicle' : 'vehicles'})
                </span>
              </div>
            </FadeIn>
          )}
        </>
      ) : null}

      <FadeIn delay={160}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TrafficByDayChart />
          <VehicleTypeDonut />
        </div>
      </FadeIn>

      <FadeIn delay={240}>
        <TrafficByHourChart />
      </FadeIn>
    </div>
  );
}
