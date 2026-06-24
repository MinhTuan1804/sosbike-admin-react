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
  height = 160
}: Props) {
  const width = Math.max(320, labels.length * 28);
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 25;

  const maxVal = Math.max(...a.map((x, i) => x + (b[i] ?? 0)), 1);
  const max = maxVal * 1.1; // Add 10% vertical space

  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;
  const barWidth = chartWidth / Math.max(1, labels.length);

  // Y-axis grid values
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = paddingTop + ratio * chartHeight;
    const val = max - ratio * (max - 0);
    return { y, val };
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "14px", fontSize: "12px", paddingLeft: `${paddingLeft}px` }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "500" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)" }} />
          {aLabel}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "500" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
          {bLabel}
        </span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", minWidth: `${width}px` }}>
        {/* Grid lines and Y axis values */}
        {gridLines.map((gl, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={gl.y}
              x2={width - paddingRight}
              y2={gl.y}
              stroke="var(--border-color)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 8}
              y={gl.y + 4}
              textAnchor="end"
              fill="var(--text-light)"
              fontSize="10px"
              fontWeight="600"
            >
              {Math.round(gl.val).toLocaleString()}
            </text>
          </g>
        ))}

        {/* The Stacked Bars */}
        {labels.map((_, i) => {
          const x = paddingLeft + i * barWidth + (barWidth * 0.15); // Add spacing between columns
          const colWidth = Math.max(8, barWidth * 0.7);
          const totalVal = (a[i] ?? 0) + (b[i] ?? 0);
          
          if (totalVal === 0) {
            // Render nothing if sum is 0
            return (
              <g key={i}>
                {/* Horizontal label */}
                {i % Math.ceil(labels.length / 10) === 0 ? (
                  <text
                    x={x + colWidth / 2}
                    y={height - 6}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="10px"
                    fontWeight="500"
                  >
                    {labels[i]}
                  </text>
                ) : null}
              </g>
            );
          }

          const totalH = (chartHeight * totalVal) / max;
          const aH = (totalH * (a[i] ?? 0)) / totalVal;
          const bH = totalH - aH;
          const yBase = height - paddingBottom;

          return (
            <g key={i}>
              {/* Bottom bar (a): Primary Blue */}
              {aH > 0 && (
                <rect
                  x={x}
                  y={yBase - aH}
                  width={colWidth}
                  height={aH}
                  fill="var(--primary)"
                  rx={bH > 0 ? "0" : "3"}
                  ry={bH > 0 ? "0" : "3"}
                />
              )}
              {/* Top bar (b): Amber */}
              {bH > 0 && (
                <rect
                  x={x}
                  y={yBase - aH - bH}
                  width={colWidth}
                  height={bH}
                  fill="#f59e0b"
                  rx="3"
                  ry="3"
                />
              )}

              {/* Total sum label at top of bar */}
              <text
                x={x + colWidth / 2}
                y={yBase - totalH - 6}
                textAnchor="middle"
                fill="var(--text-main)"
                fontSize="9px"
                fontWeight="700"
              >
                {totalVal}
              </text>

              {/* Horizontal label */}
              {i % Math.ceil(labels.length / 10) === 0 ? (
                <text
                  x={x + colWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10px"
                  fontWeight="500"
                >
                  {labels[i]}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
