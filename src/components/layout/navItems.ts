import {
  LayoutDashboard,
  Eye,
  ShieldCheck,
  Users,
  DoorOpen,
  FileText,
  FileBarChart,
  BarChart2,
  BellRing,
  HeartPulse,
  UserCog,
  ClipboardList,
  Settings,
  Database,
  Video,
  Route,
  IdCard,
  CarFront,
  type LucideIcon,
} from 'lucide-react';

interface NavChild {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Permission-grid resource key for this specific child — set whenever a group's children don't all share the parent's resource (see "Reports & Insights" below), so each is hidden/shown independently rather than all-or-nothing with the parent. */
  resource?: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Permission-grid resource key gating visibility of this item. For a parent whose children each carry their own `resource`, this is unused for visibility (the parent shows if ANY child is visible) — kept only so every item has a resource for type consistency. */
  resource: string;
  children?: NavChild[];
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, resource: 'dashboard' },
  {
    to: '/monitoring',
    label: 'Monitoring',
    icon: Eye,
    resource: 'monitoring',
    children: [
      { to: '/monitoring/live', label: 'Live View', icon: Video },
      { to: '/monitoring/tracking', label: 'Vehicle Tracking', icon: Route },
    ],
  },
  {
    to: '/masters',
    label: 'Masters',
    icon: Database,
    resource: 'masters',
    children: [
      { to: '/masters/employees', label: 'Employee Master', icon: IdCard },
      { to: '/masters/vehicles', label: 'Vehicle Master', icon: CarFront },
      { to: '/masters/visitors', label: 'Visitor Master', icon: Users },
      { to: '/masters/gates', label: 'Gate Master', icon: DoorOpen },
    ],
  },
  {
    to: '/insights',
    label: 'Reports & Insights',
    icon: FileBarChart,
    resource: 'reports',
    children: [
      { to: '/reports', label: 'Reports', icon: FileText, resource: 'reports' },
      { to: '/analytics', label: 'Analytics', icon: BarChart2, resource: 'analytics' },
      { to: '/alarms', label: 'Alarms & Events', icon: BellRing, resource: 'alarms' },
      { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, resource: 'audit_logs' },
      { to: '/system-health', label: 'System Health', icon: HeartPulse, resource: 'system_health' },
    ],
  },
  {
    to: '/users',
    label: 'Users',
    icon: UserCog,
    resource: 'users',
    children: [
      { to: '/users/accounts', label: 'Accounts', icon: UserCog },
      { to: '/users/roles', label: 'Roles & Permissions', icon: ShieldCheck },
    ],
  },
  { to: '/settings', label: 'Settings', icon: Settings, resource: 'settings' },
];
