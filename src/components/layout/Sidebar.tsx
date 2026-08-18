import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Car, ChevronDown, ChevronRight, X } from 'lucide-react';
import { navItems, type NavItem } from './navItems';
import Select from '../ui/Select';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useInterval } from '../../hooks/useInterval';
import { usePermissions } from '../../context/PermissionsContext';
import { getAnalyticsSummary } from '../../services/analyticsService';
import { getGates } from '../../services/gatesService';
import type { AnalyticsTotals } from '../../types/analytics';
import type { GateConfig } from '../../types/gate';
import anprLogo from '../../assets/gate-vision-logo.png';

const SUMMARY_POLL_MS = 20000;

function todayStartIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

interface SidebarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleSidebar,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = usePersistedState('anpr_sidebar_summary_open', false);
  const { loading: permissionsLoading, canView } = usePermissions();

  const [gates, setGates] = useState<GateConfig[]>([]);
  const [gateFilter, setGateFilter] = useState('');
  const [totals, setTotals] = useState<AnalyticsTotals | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const canViewSummary = canView('analytics');

  useEffect(() => {
    if (!canViewSummary) return;
    getGates()
      .then((res) => setGates(res.filter((g) => g.enabled)))
      .catch(() => {
        // Gate list is a convenience filter — silently skip if it fails to load.
      });
  }, [canViewSummary]);

  const refreshSummary = useCallback(async () => {
    if (!canViewSummary) return;
    try {
      const res = await getAnalyticsSummary({
        start_date: todayStartIso(),
        end_date: new Date().toISOString(),
        cam_id: gateFilter || undefined,
      });
      setTotals(res.totals);
      setSummaryError(null);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [canViewSummary, gateFilter]);

  useEffect(() => {
    if (summaryOpen) refreshSummary();
  }, [summaryOpen, refreshSummary]);

  // Keeps the widget live while expanded, without hammering the API while
  // it's collapsed (the interval still ticks, refreshSummary just no-ops
  // via the summaryOpen check inside the effect above having already run —
  // this only needs to matter for the recurring tick, not the initial load).
  useInterval(() => {
    if (summaryOpen) refreshSummary();
  }, SUMMARY_POLL_MS);

  const summaryItems = useMemo(() => {
    if (!totals) return [];
    return [
      { label: 'Total Vehicles', value: totals.entries + totals.exits, color: 'text-slate-700' },
      { label: 'Entry', value: totals.entries, color: 'text-emerald-600' },
      { label: 'Exit', value: totals.exits, color: 'text-blue-600' },
      { label: 'Denied', value: totals.unauthorized_attempts, color: 'text-red-600' },
      { label: 'Visitors', value: totals.visitor_entries, color: 'text-amber-600' },
    ];
  }, [totals]);

  const visibleNavItems = useMemo(() => {
    if (permissionsLoading) return [];
    return navItems.reduce<NavItem[]>((acc, item) => {
      if (!item.children) {
        if (canView(item.resource)) acc.push(item);
        return acc;
      }
      // A group's children are shown/hidden independently by their own
      // resource (falling back to the parent's if unset) — the group
      // itself only appears if at least one child is visible, so a role
      // missing some but not all of a group's permissions never sees a
      // menu item that 403s when clicked.
      const visibleChildren = item.children.filter((c) => canView(c.resource ?? item.resource));
      if (visibleChildren.length > 0) acc.push({ ...item, children: visibleChildren });
      return acc;
    }, []);
  }, [permissionsLoading, canView]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:z-0 md:translate-x-0 md:transition-[width] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-[72px]' : 'md:w-64'}`}
      >
        <div
          className={`flex h-20 items-center border-b border-slate-200 ${
            collapsed ? 'md:justify-center md:px-2' : 'px-5'
          }`}
        >
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-md py-2 hover:bg-slate-100"
          >
            {(!collapsed || mobileOpen) ? (
              <img src={anprLogo} alt="Gate Vision" className="h-14 w-auto shrink-0 object-contain" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <Car className="h-5 w-5 text-white" />
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children?.length;
            const isExpanded = expanded === item.to;

            return (
              <div key={item.to}>
                {hasChildren ? (
                  <button
                    type="button"
                    title={collapsed && !mobileOpen ? item.label : undefined}
                    onClick={() =>
                      collapsed && !mobileOpen
                        ? undefined
                        : setExpanded(isExpanded ? null : item.to)
                    }
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
                      collapsed && !mobileOpen
                        ? 'justify-center'
                        : 'justify-between'
                    }`}
                  >
                    <span
                      className={`flex items-center ${
                        collapsed && !mobileOpen ? '' : 'gap-3'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {(!collapsed || mobileOpen) && item.label}
                    </span>
                    {(!collapsed || mobileOpen) &&
                      (isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ))}
                  </button>
                ) : (
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onCloseMobile}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        collapsed && !mobileOpen ? 'justify-center' : 'gap-3'
                      } ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {(!collapsed || mobileOpen) && item.label}
                  </NavLink>
                )}

                {hasChildren && isExpanded && (!collapsed || mobileOpen) && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`
                          }
                        >
                          <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {(!collapsed || mobileOpen) && canViewSummary && (
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={() => setSummaryOpen((prev) => !prev)}
              className="mb-3 flex w-full items-center justify-between"
            >
              <p className="text-xs font-semibold text-slate-700">
                Today&apos;s Summary
              </p>
              {summaryOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
            {summaryOpen && (
              <>
                <Select
                  value={gateFilter}
                  onChange={(e) => setGateFilter(e.target.value)}
                  className="mb-3 text-xs"
                >
                  <option value="">All Gates</option>
                  {gates.map((g) => (
                    <option key={g.camera_id} value={g.camera_id}>
                      {g.gate_name}
                    </option>
                  ))}
                </Select>
                {summaryLoading ? (
                  <p className="py-1 text-xs text-slate-400">Loading…</p>
                ) : summaryError ? (
                  <p className="py-1 text-xs text-red-600">{summaryError}</p>
                ) : (
                  <ul className="space-y-2">
                    {summaryItems.map((s) => (
                      <li
                        key={s.label}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-500">{s.label}</span>
                        <span className={`font-semibold ${s.color}`}>
                          {s.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
