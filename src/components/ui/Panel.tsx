import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
}

export default function Panel({ title, action, children, className, badge }: PanelProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md ${className ?? ''}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {badge}
        </div>
        {action}
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
