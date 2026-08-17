import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Car, ChevronDown, ChevronRight, X } from 'lucide-react';
import { navItems, type NavItem } from './navItems';
import Select from '../ui/Select';
import { usePersistedState } from '../../hooks/usePersistedState';
import { usePermissions } from '../../context/PermissionsContext';
import anprLogo from '../../assets/anpr-logo.png';

const summaryItems = [
  { label: 'Total Vehicles', value: '1,265', color: 'text-slate-700' },
  { label: 'Entry', value: '632', color: 'text-emerald-600' },
  { label: 'Exit', value: '633', color: 'text-blue-600' },
  { label: 'Denied', value: '12', color: 'text-red-600' },
  { label: 'Visitors', value: '63', color: 'text-amber-600' },
];

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
              <img src={anprLogo} alt="ANPR" className="h-14 w-auto shrink-0 object-contain" />
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

        {(!collapsed || mobileOpen) && (
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
                <Select className="mb-3 text-xs">
                  <option>All Gates</option>
                </Select>
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
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
