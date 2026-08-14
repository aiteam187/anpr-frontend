import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from '../../hooks/useInterval';
import {
  getActiveVehicles,
  getHistory,
  getLatestDetection,
  getUnauthorizedAttempts,
} from '../../services/dashboardService';
import { getGates } from '../../services/gatesService';
import { getSystemHealth } from '../../services/healthService';
import { getAuthorizedVehicles } from '../../services/authorizedVehiclesService';
import type {
  ActiveVehicle,
  HistoryRecord,
  LatestDetection,
  UnauthorizedAttempt,
} from '../../types/detection';
import type { GateConfig } from '../../types/gate';
import type { SystemHealth } from '../../types/health';
import type { AuthorizedVehicle } from '../../types/authorizedVehicle';

export interface DashboardData {
  latestDetection: LatestDetection | null;
  activeVehicles: ActiveVehicle[];
  history: HistoryRecord[];
  unauthorizedAttempts: UnauthorizedAttempt[];
  gates: GateConfig[];
  health: SystemHealth | null;
  authorizedVehicles: AuthorizedVehicle[];
  loading: boolean;
  lastUpdated: Date | null;
  errors: string[];
}

// Backend responds in well under 50ms per endpoint (verified live), so a short
// interval here is safe — this is what actually makes the dashboard feel
// real-time instead of visibly lagging behind physical gate events.
const POLL_MS = 1500;

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    latestDetection: null,
    activeVehicles: [],
    history: [],
    unauthorizedAttempts: [],
    gates: [],
    health: null,
    authorizedVehicles: [],
    loading: true,
    lastUpdated: null,
    errors: [],
  });

  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      getLatestDetection(),
      getActiveVehicles(),
      getHistory(),
      getUnauthorizedAttempts(),
      getGates(),
      getSystemHealth(),
      getAuthorizedVehicles(),
    ]);

    const [
      latestDetectionRes,
      activeVehiclesRes,
      historyRes,
      unauthorizedAttemptsRes,
      gatesRes,
      healthRes,
      authorizedVehiclesRes,
    ] = results;

    const errors: string[] = [];
    results.forEach((r) => {
      if (r.status === 'rejected') errors.push(String(r.reason));
    });

    setData((prev) => ({
      latestDetection:
        latestDetectionRes.status === 'fulfilled'
          ? latestDetectionRes.value
          : prev.latestDetection,
      activeVehicles:
        activeVehiclesRes.status === 'fulfilled'
          ? activeVehiclesRes.value
          : prev.activeVehicles,
      history: historyRes.status === 'fulfilled' ? historyRes.value : prev.history,
      unauthorizedAttempts:
        unauthorizedAttemptsRes.status === 'fulfilled'
          ? unauthorizedAttemptsRes.value
          : prev.unauthorizedAttempts,
      gates: gatesRes.status === 'fulfilled' ? gatesRes.value : prev.gates,
      health: healthRes.status === 'fulfilled' ? healthRes.value : prev.health,
      authorizedVehicles:
        authorizedVehiclesRes.status === 'fulfilled'
          ? authorizedVehiclesRes.value
          : prev.authorizedVehicles,
      loading: false,
      lastUpdated: new Date(),
      errors,
    }));
    hasLoadedOnce.current = true;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, POLL_MS);

  return data;
}
