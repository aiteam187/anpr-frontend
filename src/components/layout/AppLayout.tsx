import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePersistedState } from '../../hooks/usePersistedState';
import { LAST_PATH_KEY } from '../../routes/lastPath';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = usePersistedState('anpr_sidebar_collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Tracks the current route in sessionStorage (not just React Router's
  // in-memory location.state) so that if the session ever needs to
  // re-authenticate — token expired, a hard refresh raced the auth check,
  // etc. — the login flow can send you back to where you actually were
  // instead of defaulting to Dashboard.
  useEffect(() => {
    sessionStorage.setItem(LAST_PATH_KEY, location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
