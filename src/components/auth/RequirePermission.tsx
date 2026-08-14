import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { usePermissions } from '../../context/PermissionsContext';

interface RequirePermissionProps {
  resource: string;
  children: ReactNode;
}

export default function RequirePermission({ resource, children }: RequirePermissionProps) {
  const { loading, canView } = usePermissions();

  if (loading) return null;

  if (!canView(resource)) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">Access denied</p>
        <p className="text-xs text-slate-400">Your role does not have access to this section.</p>
      </div>
    );
  }

  return <>{children}</>;
}
