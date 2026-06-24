type Props = {
  labels: string[];
  values: number[];
  height?: number;
  stroke?: string;
};

export function SimpleLineChart({ labels, values, height = 160, stroke = "#2563eb" }: Props) {
  const width = Math.max(320, labels.length * 30);
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 25;

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1) * 1.1; // Add 10% padding on top
  const span = max - min || 1;

  const coords = values.map((v, i) => {
    const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / Math.max(1, values.length - 1);
    const y = paddingTop + ((max - v) * (height - paddingTop - paddingBottom)) / span;
    return { x, y, value: v };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  
  const fillPath = coords.length > 0 
    ? `${linePath} L ${coords[coords.length - 1].x} ${height - paddingBottom} L ${coords[0].x} ${height - paddingBottom} Z` 
    : "";

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
    const val = max - ratio * span;
    return { y, val };
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", minWidth: `${width}px` }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines & Y Axis values */}
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

        {/* Gradient Area Fill */}
        {fillPath && <path d={fillPath} fill="url(#chartGradient)" />}

        {/* The Line */}
        {linePath && <path d={linePath} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Data points & Labels */}
        {coords.map((c, i) => (
          <g key={i} className="chart-dot-group">
            <circle
              cx={c.x}
              cy={c.y}
              r="4.5"
              fill="var(--card-bg)"
              stroke={stroke}
              strokeWidth="2.5"
            />
            
            {/* Show value label on high-density displays if needed, otherwise show clean metadata */}
            {coords.length <= 15 ? (
              <text
                x={c.x}
                y={c.y - 10}
                textAnchor="middle"
                fill="var(--text-main)"
                fontSize="10px"
                fontWeight="700"
              >
                {Math.round(c.value).toLocaleString()}
              </text>
            ) : null}

            {/* X Axis Labels */}
            {i % Math.ceil(coords.length / 10) === 0 ? (
              <text
                x={c.x}
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
        ))}
      </svg>
    </div>
  );
}
