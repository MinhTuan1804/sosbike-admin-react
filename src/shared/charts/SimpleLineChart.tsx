type Props = {
  labels: string[];
  values: number[];
  height?: number;
  stroke?: string;
};

export function SimpleLineChart({ labels, values, height = 120, stroke = "#2563eb" }: Props) {
  const width = Math.max(300, labels.length * 18);
  const padding = 16;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = padding + (i * (width - padding * 2)) / Math.max(1, values.length - 1);
      const y = padding + ((max - v) * (height - padding * 2)) / span;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
      <svg width={width} height={height} style={{ display: "block" }}>
        <polyline fill="none" stroke={stroke} strokeWidth="2.5" points={points} />
      </svg>
    </div>
  );
}

