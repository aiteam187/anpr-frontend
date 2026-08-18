import { useCallback, useEffect, useState } from 'react';
import { Menu, Calendar, Clock, Bell, AlertTriangle, User, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClock } from '../../hooks/useClock';
import { useAuth } from '../../context/AuthContext';
import { useInterval } from '../../hooks/useInterval';
import { getAlarms } from '../../services/alarmsService';
import {
  alarmSeverity,
  alarmTarget,
  alarmTimestamp,
  alarmTitle,
} from '../../features/alarms/readAlarmField';
import { formatRelativeTime } from '../../utils/format';
import AnimatedText from '../ui/AnimatedText';
import type { AlarmItem } from '../../types/alarms';

const ALARM_POLL_MS = 3000;
const DISMISSED_ALARMS_KEY = 'anpr_dismissed_alarms';

/** Alarms have no persisted ID (the backend computes them live, nothing is
 * stored) — this is the closest thing to a stable identity across polls.
 * Deliberately NOT alarmTitle(): several alarm types (overstay, camera
 * silent) embed a live-updating duration right in their message text
 * ("has overstayed (inside 4h 5s)"), which changes every poll — using
 * that as part of the key made every "same" alarm look brand new each
 * time, so a dismissed one reappeared within seconds. `type` is the
 * backend's own stable category field for the same condition. */
function alarmKey(alarm: AlarmItem): string {
  const type = typeof alarm.type === 'string' ? alarm.type : alarmTitle(alarm);
  return `${type}::${alarmTarget(alarm) ?? ''}`;
}

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_ALARMS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(keys: Set<string>) {
  localStorage.setItem(DISMISSED_ALARMS_KEY, JSON.stringify(Array.from(keys)));
}

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function Header({ onOpenMobileSidebar }: HeaderProps) {
  const now = useClock();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alarmsOpen, setAlarmsOpen] = useState(false);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  const refreshAlarms = useCallback(async () => {
    try {
      const res = await getAlarms();
      setAlarms(res.alarms);
      // Self-cleaning: once an alarm's underlying condition actually clears,
      // the backend stops returning it at all — drop it from the dismissed
      // set too, so if that same alarm genuinely recurs later, it notifies
      // again instead of staying silently dismissed forever.
      setDismissed((prev) => {
        const liveKeys = new Set(res.alarms.map(alarmKey));
        const next = new Set(Array.from(prev).filter((k) => liveKeys.has(k)));
        if (next.size !== prev.size) saveDismissed(next);
        return next;
      });
    } catch {
      // Silently ignore — the bell just stays at its last known count.
    }
  }, []);

  useEffect(() => {
    refreshAlarms();
  }, [refreshAlarms]);

  useInterval(refreshAlarms, ALARM_POLL_MS);

  const visibleAlarms = alarms.filter((a) => !dismissed.has(alarmKey(a)));
  const alarmCount = visibleAlarms.length;

  const dismissAlarm = (key: string) => {
    setDismissed((prev) => {
      const next = new Set(prev).add(key);
      saveDismissed(next);
      return next;
    });
  };

  const dismissAll = () => {
    setDismissed((prev) => {
      const next = new Set(prev);
      alarms.forEach((a) => next.add(alarmKey(a)));
      saveDismissed(next);
      return next;
    });
  };

  const dateLabel = `${now.getDate().toString().padStart(2, '0')} ${
    MONTH_NAMES[now.getMonth()]
  } ${now.getFullYear()}`;

  const hours24 = now.getHours();
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeLabel = `${hours12} : ${minutes} ${period}`;

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-24 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 sm:px-3"
        >
          <Calendar className="h-4 w-4" />
          <AnimatedText text={dateLabel} className="hidden sm:inline" />
        </button>

        <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs tabular-nums text-slate-600 sm:flex">
          <Clock className="h-4 w-4" />
          <AnimatedText text={timeLabel} />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAlarmsOpen((prev) => !prev)}
            className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="h-4 w-4" />
            {alarmCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {alarmCount > 9 ? '9+' : alarmCount}
              </span>
            )}
          </button>

          {alarmsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAlarmsOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">Alarms & Events</p>
                  {visibleAlarms.length > 0 && (
                    <button
                      type="button"
                      onClick={dismissAll}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {visibleAlarms.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-slate-400">
                      No active alarms — all clear
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {visibleAlarms.slice(0, 6).map((alarm, idx) => {
                        const severity = alarmSeverity(alarm);
                        const target = alarmTarget(alarm);
                        const timestamp = alarmTimestamp(alarm);
                        const key = alarmKey(alarm);
                        return (
                          <li key={idx} className="group flex items-start gap-2 px-3 py-2">
                            <div
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                                severity === 'critical'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-slate-900">{alarmTitle(alarm)}</p>
                              {target && <p className="truncate text-xs text-slate-500">{target}</p>}
                            </div>
                            {timestamp && (
                              <span className="shrink-0 text-xs text-slate-400">
                                {formatRelativeTime(timestamp)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => dismissAlarm(key)}
                              className="shrink-0 rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                              title="Clear"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAlarmsOpen(false);
                    navigate('/alarms');
                  }}
                  className="block w-full border-t border-slate-100 px-3 py-2 text-center text-sm text-blue-600 hover:bg-slate-50"
                >
                  View all
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-1.5 hover:bg-slate-100 sm:px-2"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="hidden text-xs font-medium capitalize text-slate-700 sm:inline">
              {user?.role ?? 'Account'}
            </span>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user?.full_name}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-500">{user?.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
