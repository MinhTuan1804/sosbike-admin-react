import { useState } from "react";

type Props = {
  values: Array<{ label: string; value: number; color: string }>;
  size?: number;
  subLabel?: string;
  valueFormatter?: (val: number) => string;
};

export function SimpleDonut({ 
  values, 
  size = 160, 
  subLabel = "Tổng đơn",
  valueFormatter = (val) => val.toLocaleString()
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = values.reduce((s, x) => s + x.value, 0) || 0;
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const textToRender = hoveredIndex !== null ? valueFormatter(values[hoveredIndex].value) : valueFormatter(total);
  // Dynamically calculate font size based on the rendered text length
  const calculatedFontSize = textToRender.length > 15 ? "11px" : textToRender.length > 11 ? "13px" : textToRender.length > 8 ? "15px" : "18px";

  return (
    <div style={{
      display: "flex",
      gap: "24px",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%"
    }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
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
              fontSize: calculatedFontSize,
              fontWeight: "800",
              fill: hoveredIndex !== null ? values[hoveredIndex].color : "var(--secondary)",
              transition: "fill 0.15s ease, font-size 0.15s ease"
            }}
          >
            {textToRender}
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
            {hoveredIndex !== null ? values[hoveredIndex].label : subLabel}
          </text>
        </svg>
      </div>

      <div style={{ display: "grid", gap: "10px", flex: 1, minWidth: 0 }}>
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
                transition: "all 0.15s ease",
                gap: "12px"
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: 0, flex: 1 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: v.color, display: "inline-block", flexShrink: 0 }} />
                <span 
                  style={{ 
                    color: "var(--text-muted)", 
                    fontWeight: "500", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    whiteSpace: "nowrap" 
                  }} 
                  title={v.label}
                >
                  {v.label}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                <b style={{ color: "var(--text-main)", whiteSpace: "nowrap" }}>{valueFormatter(v.value)}</b>
                <span style={{ color: "var(--text-light)", fontSize: "10px", background: "var(--neutral-bg)", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
