import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getMyPermissions } from '../services/rolesService';

interface PermissionsContextValue {
  loading: boolean;
  /** The role this permissions grid was actually fetched for — always
   * live from the backend (see get_current_user's fresh DB lookup), unlike
   * AuthContext.user.role which is only ever set at login and goes stale
   * the moment your role gets renamed/reassigned mid-session. Prefer this
   * over AuthContext.user.role for any "is this my own role" check. */
  role: string | null;
  canView: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [grid, setGrid] = useState<Record<string, { can_view: boolean; can_manage: boolean }>>({});
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setGrid({});
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getMyPermissions();
      const next: Record<string, { can_view: boolean; can_manage: boolean }> = {};
      for (const p of res.permissions) next[p.resource] = { can_view: p.can_view, can_manage: p.can_manage };
      setGrid(next);
      setRole(res.role);
    } catch {
      // Leave the grid empty on failure — default-deny is the safe fallback,
      // matching the backend's own default-deny behavior for unknown rows.
      setGrid({});
      setRole(null);
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
    () => ({ loading, role, canView, canManage, refresh }),
    [loading, role, canView, canManage, refresh],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}
