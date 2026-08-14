import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getMyPermissions } from '../services/rolesService';

interface PermissionsContextValue {
  loading: boolean;
  canView: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [grid, setGrid] = useState<Record<string, { can_view: boolean; can_manage: boolean }>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setGrid({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getMyPermissions();
      const next: Record<string, { can_view: boolean; can_manage: boolean }> = {};
      for (const p of res.permissions) next[p.resource] = { can_view: p.can_view, can_manage: p.can_manage };
      setGrid(next);
    } catch {
      // Leave the grid empty on failure — default-deny is the safe fallback,
      // matching the backend's own default-deny behavior for unknown rows.
      setGrid({});
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canView = useCallback((resource: string) => grid[resource]?.can_view ?? false, [grid]);
  const canManage = useCallback((resource: string) => grid[resource]?.can_manage ?? false, [grid]);

  const value = useMemo<PermissionsContextValue>(
    () => ({ loading, canView, canManage }),
    [loading, canView, canManage],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}
