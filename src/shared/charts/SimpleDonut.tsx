import { useState } from "react";

type Props = {
  values: Array<{ label: string; value: number; color: string }>;
  size?: number;
};

export function SimpleDonut({ values, size = 160 }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = values.reduce((s, x) => s + x.value, 0) || 0;
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div style={{
      display: "flex",
      gap: "24px",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {values.map((v, index) => {
              const frac = total > 0 ? v.value / total : 0;
              const dash = frac * circ;
              const isHovered = hoveredIndex === index;
              const el = (
                <circle
                  key={v.label}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="transparent"
                  stroke={v.color}
                  strokeWidth={isHovered ? "14" : "10"}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap={dash > 0 ? "round" : "butt"}
                  style={{
                    cursor: "pointer",
                    transition: "stroke-width 0.15s ease, stroke-dashoffset 0.3s ease"
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
              offset += dash;
              return el;
            })}
          </g>
          {/* Inner circle space */}
          <circle cx={cx} cy={cy} r={r - 6} fill="var(--card-bg)" />
          
          {/* Center text */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: hoveredIndex !== null ? "16px" : "20px",
              fontWeight: "800",
              fill: hoveredIndex !== null ? values[hoveredIndex].color : "var(--secondary)",
              transition: "fill 0.15s ease, font-size 0.15s ease"
            }}
          >
            {hoveredIndex !== null ? values[hoveredIndex].value.toLocaleString() : total.toLocaleString()}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: "10px",
              fontWeight: "600",
              fill: "var(--text-light)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            {hoveredIndex !== null ? values[hoveredIndex].label : "Tổng đơn"}
          </text>
        </svg>
      </div>

      <div style={{ display: "grid", gap: "10px", flex: 1 }}>
        {values.map((v, index) => {
          const percent = total > 0 ? Math.round((v.value / total) * 100) : 0;
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={v.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                borderBottom: "1px solid var(--neutral-bg)",
                paddingBottom: "6px",
                background: isHovered ? "var(--primary-light)" : "transparent",
                borderRadius: "4px",
                paddingLeft: isHovered ? "6px" : "0",
                paddingRight: isHovered ? "6px" : "0",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: v.color, display: "inline-block" }} />
                <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>{v.label}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <b style={{ color: "var(--text-main)" }}>{v.value.toLocaleString()}</b>
                <span style={{ color: "var(--text-light)", fontSize: "10px", background: "var(--neutral-bg)", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
