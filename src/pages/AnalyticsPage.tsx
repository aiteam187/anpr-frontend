import { useCallback, useEffect, useState } from 'react';
import { Ban, Car, LogIn, LogOut, ShieldAlert, TrendingUp } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import FadeIn from '../components/ui/FadeIn';
import StatTile from '../features/dashboard/StatTile';
import { SkeletonStatTiles } from '../components/ui/Skeleton';
import DateRangeDropdown from '../components/ui/DateRangeDropdown';
import TrafficByDayChart from '../features/analytics/charts/TrafficByDayChart';
import TrafficByHourChart from '../features/analytics/charts/TrafficByHourChart';
import VehicleTypeDonut from '../features/analytics/charts/VehicleTypeDonut';
import { getAnalyticsSummary } from '../services/analyticsService';
import { getRangeForPreset, localDateStr, type RangePreset } from '../utils/dateRange';
import type { AnalyticsSummary } from '../types/analytics';

const INITIAL = getRangeForPreset('today');

export default function AnalyticsPage() {
  const [activePreset, setActivePreset] = useState<Exclude<RangePreset, 'custom'> | 'custom' | null>('today');
  const [startDate, setStartDate] = useState(localDateStr(INITIAL.start));
  const [endDate, setEndDate] = useState(localDateStr(INITIAL.end));
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const res = await getAnalyticsSummary({
        start_date: start ? `${start}T00:00:00` : undefined,
        end_date: end ? `${end}T23:59:59` : undefined,
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

  const applyPreset = (preset: Exclude<RangePreset, 'custom'>) => {
    const range = getRangeForPreset(preset);
    const start = localDateStr(range.start);
    const end = localDateStr(range.end);
    setStartDate(start);
    setEndDate(end);
    setActivePreset(preset);
    refresh(start, end);
  };

  const applyCustomRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset('custom');
    refresh(start, end);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset(null);
    refresh('', '');
  };

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
        <div className="flex items-center gap-2">
          <DateRangeDropdown
            preset={activePreset}
            startDate={startDate}
            endDate={endDate}
            onPreset={applyPreset}
            onCustomRange={applyCustomRange}
            onClear={clearDateFilter}
          />
          <button
            type="button"
            onClick={clearDateFilter}
            disabled={activePreset === null}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear filters
          </button>
        </div>
      </Panel>

      {loading ? (
        <SkeletonStatTiles count={5} gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" />
      ) : error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : summary ? (
        <>
          <FadeIn>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
