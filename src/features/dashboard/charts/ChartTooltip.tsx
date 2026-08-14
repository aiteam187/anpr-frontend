interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  items: { name: string; value: number; color: string }[];
}

export default function ChartTooltip({ active, label, items }: ChartTooltipProps) {
  if (!active) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label && <p className="mb-1 text-xs font-medium text-slate-900">{label}</p>}
      <div className="space-y-0.5">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-500">{item.name}</span>
            <span className="ml-auto font-medium tabular-nums text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
