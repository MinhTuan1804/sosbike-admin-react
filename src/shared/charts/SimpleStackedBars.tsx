type Props = {
  labels: string[];
  a: number[];
  b: number[];
  aLabel?: string;
  bLabel?: string;
  height?: number;
};

export function SimpleStackedBars({
  labels,
  a,
  b,
  aLabel = "A",
  bLabel = "B",
  height = 140
}: Props) {
  const width = Math.max(320, labels.length * 18);
  const padding = 16;
  const max = Math.max(...a.map((x, i) => x + (b[i] ?? 0)), 1);

  const barWidth = (width - padding * 2) / Math.max(1, labels.length);

  return (
    <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 6, fontSize: 12, color: "#555" }}>
        <span>
          <span style={{ display: "inline-block", width: 10, height: 10, background: "#16a34a", marginRight: 6 }} />
          {aLabel}
        </span>
        <span>
          <span style={{ display: "inline-block", width: 10, height: 10, background: "#f59e0b", marginRight: 6 }} />
          {bLabel}
        </span>
      </div>
      <svg width={width} height={height} style={{ display: "block" }}>
        {labels.map((_, i) => {
          const x = padding + i * barWidth + 2;
          const total = (a[i] ?? 0) + (b[i] ?? 0);
          const totalH = ((height - padding * 2) * total) / max;
          const aH = total === 0 ? 0 : (totalH * (a[i] ?? 0)) / total;
          const bH = totalH - aH;
          const yBase = height - padding;

          return (
            <g key={i}>
              <rect x={x} y={yBase - aH} width={Math.max(2, barWidth - 4)} height={aH} fill="#16a34a" />
              <rect x={x} y={yBase - aH - bH} width={Math.max(2, barWidth - 4)} height={bH} fill="#f59e0b" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

