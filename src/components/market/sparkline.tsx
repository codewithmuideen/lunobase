import { useId } from "react";

/** Lightweight SVG sparkline (no chart library needed for table rows). */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  positive,
  fill = true,
  responsive,
}: {
  data: number[] | undefined;
  width?: number;
  height?: number;
  positive?: boolean;
  fill?: boolean;
  /** Stretch to the container's width. */
  responsive?: boolean;
}) {
  const id = useId();
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  // downsample to ~48 points for crisp rendering
  const step = Math.max(1, Math.floor(data.length / 48));
  const pts = data.filter((_, i) => i % step === 0);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const up = positive ?? pts[pts.length - 1] >= pts[0];
  const color = up ? "#1FCF8F" : "#F6465D";
  const coords = pts.map((v, i) => [(i / (pts.length - 1)) * width, height - 2 - ((v - min) / range) * (height - 4)]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg
      width={responsive ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={responsive ? "none" : undefined}
      aria-hidden
      className="block overflow-visible"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
