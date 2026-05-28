type Props = {
  values: Array<{ label: string; value: number; color: string }>;
  size?: number;
};

export function SimpleDonut({ values, size = 140 }: Props) {
  const total = values.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {values.map((v) => {
            const frac = v.value / total;
            const dash = frac * circ;
            const el = (
              <circle
                key={v.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="transparent"
                stroke={v.color}
                strokeWidth="16"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
        <circle cx={cx} cy={cy} r={r - 14} fill="#fff" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 14, fill: "#111" }}>
          {Math.round(total)}
        </text>
      </svg>
      <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
        {values.map((v) => (
          <div key={v.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 10, height: 10, background: v.color, display: "inline-block" }} />
            <span style={{ minWidth: 80 }}>{v.label}</span>
            <b>{v.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

