interface SparklineProps {
  data: number[];
  accent: string;
  width?: number;
  height?: number;
}

// A minimal trend indicator, not a full chart: no axes, no gridlines, no
// tooltip. Line + wash in the accent hue, a filled end-dot marking "now".
// Flat/empty data still renders a flat line rather than nothing, so the
// tile's layout never jumps around depending on whether there's a trend.
export default function Sparkline({ data, accent, width = 72, height = 28 }: SparklineProps) {
  const values = data.length > 0 ? data : [0];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  const gradientId = `spark-${accent.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={accent} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r={2.5} fill={accent} stroke="white" strokeWidth={1.5} />
    </svg>
  );
}
