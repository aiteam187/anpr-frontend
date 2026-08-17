import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Defaults to true (fills its container, matching the old inputClass selects). Set false to size to content instead — e.g. a select sitting next to a button. */
  fullWidth?: boolean;
}

/** Native select with a consistently spaced custom chevron, used everywhere instead of the browser's default arrow. */
export default function Select({ className = '', fullWidth = true, ...props }: SelectProps) {
  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
      <select
        {...props}
        className={`${fullWidth ? 'w-full' : ''} appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-9 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
