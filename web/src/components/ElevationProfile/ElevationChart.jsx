import React, { useRef, useState, useCallback } from "react";

const CHART_HEIGHT = 120;
const PADDING = { top: 12, right: 52, bottom: 20, left: 12 };

export default function ElevationChart({ profile }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  if (!profile?.length) return null;

  const maxDist = profile[profile.length - 1].distance_km;
  const elevations = profile.map((p) => p.elevation_m);
  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const elevRange = maxElev - minElev || 1;

  const innerW = 1000; // SVG coordinate space width
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  function xScale(dist) {
    return PADDING.left + (dist / maxDist) * innerW;
  }
  function yScale(elev) {
    return PADDING.top + innerH - ((elev - minElev) / elevRange) * innerH;
  }

  // Build SVG path
  const pathD = profile
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.distance_km).toFixed(1)},${yScale(p.elevation_m).toFixed(1)}`)
    .join(" ");

  // Closed area path for fill
  const areaD =
    pathD +
    ` L${xScale(maxDist).toFixed(1)},${(PADDING.top + innerH).toFixed(1)} L${PADDING.left},${(PADDING.top + innerH).toFixed(1)} Z`;

  const handleMouseMove = useCallback(
    (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgWidth = rect.width;
      const relX = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, (relX - (PADDING.left / innerW) * svgWidth) / svgWidth));
      const dist = fraction * maxDist;
      const closest = profile.reduce((a, b) =>
        Math.abs(a.distance_km - dist) < Math.abs(b.distance_km - dist) ? a : b
      );
      setTooltip({ x: relX, dist: closest.distance_km, elev: closest.elevation_m });
    },
    [profile, maxDist]
  );

  // Y-axis tick labels
  const tickCount = 3;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const elev = minElev + (i / (tickCount - 1)) * elevRange;
    return { elev: Math.round(elev), y: yScale(elev) };
  });

  const viewBox = `0 0 ${innerW + PADDING.left + PADDING.right} ${CHART_HEIGHT}`;

  return (
    <div className="relative bg-forest-800/90 backdrop-blur border-t border-forest-600 h-16 md:h-[120px]">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Area fill */}
        <defs>
          <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E05A2B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E05A2B" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#elevGrad)" />
        <path d={pathD} fill="none" stroke="#E05A2B" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />

        {/* Y-axis ticks — labels on the right to stay clear of the sidebar */}
        {ticks.map((t) => (
          <g key={t.elev}>
            <line
              x1={PADDING.left}
              y1={t.y}
              x2={innerW + PADDING.left}
              y2={t.y}
              stroke="rgba(100,180,140,0.15)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={innerW + PADDING.left + 6}
              y={t.y}
              textAnchor="start"
              dominantBaseline="middle"
              fill="rgba(100,180,140,0.7)"
              fontSize="22"
            >
              {t.elev}m
            </text>
          </g>
        ))}

        {/* Hover crosshair */}
        {tooltip && (
          <line
            x1={tooltip.x * ((innerW + PADDING.left + PADDING.right) / (svgRef.current?.getBoundingClientRect().width || 1))}
            y1={PADDING.top}
            x2={tooltip.x * ((innerW + PADDING.left + PADDING.right) / (svgRef.current?.getBoundingClientRect().width || 1))}
            y2={PADDING.top + innerH}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Tooltip bubble */}
      {tooltip && (
        <div
          className="absolute top-2 pointer-events-none bg-forest-900/90 text-white text-xs px-2 py-1 rounded border border-forest-600"
          style={{ left: Math.min(tooltip.x + 8, window.innerWidth - 160) }}
        >
          <span className="text-coral-400 font-medium">{tooltip.dist.toFixed(1)} km</span>
          <span className="text-seafoam-400 ml-2">{Math.round(tooltip.elev)} m</span>
        </div>
      )}
    </div>
  );
}
