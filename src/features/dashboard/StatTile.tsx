import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import AnimatedText from '../../components/ui/AnimatedText';
import Sparkline from '../../components/ui/Sparkline';

type Tone = 'default' | 'success' | 'warning' | 'danger';

const TONE_STYLES: Record<Tone, { icon: string; glow: string; accent: string; wash: string }> = {
  default: {
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/25',
    accent: '#2563eb',
    wash: 'from-blue-50/80',
  },
  success: {
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    glow: 'shadow-emerald-500/25',
    accent: '#059669',
    wash: 'from-emerald-50/80',
  },
  warning: {
    icon: 'bg-gradient-to-br from-amber-500 to-amber-600',
    glow: 'shadow-amber-500/25',
    accent: '#d97706',
    wash: 'from-amber-50/80',
  },
  danger: {
    icon: 'bg-gradient-to-br from-red-500 to-red-600',
    glow: 'shadow-red-500/25',
    accent: '#dc2626',
    wash: 'from-red-50/80',
  },
};

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: Tone;
  to?: string;
  trend?: number[];
}

export default function StatTile({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = 'default',
  to,
  trend,
}: StatTileProps) {
  const styles = TONE_STYLES[tone];

  const content = (
    <>
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${styles.wash} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${styles.icon} ${styles.glow}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            <AnimatedText text={String(value)} />
          </p>
          {sublabel && <p className="truncate text-[11px] text-slate-400">{sublabel}</p>}
        </div>
        {trend && (
          <div className="hidden shrink-0 sm:block">
            <Sparkline data={trend} accent={styles.accent} />
          </div>
        )}
      </div>
    </>
  );

  const className = `group relative flex overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 ${
    to ? 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg' : ''
  }`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
