import { Link } from 'react-router-dom';
import {
  BarChart2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Panel from '../../components/ui/Panel';

const LINKS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/masters/vehicles', label: 'Vehicle Master', icon: ShieldCheck },
  { to: '/masters/visitors', label: 'Visitor Master', icon: Users },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
];

export default function QuickLinksPanel() {
  return (
    <Panel title="Quick Links">
      <div className="grid grid-cols-2 gap-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}
