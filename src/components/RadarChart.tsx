import React from 'react';

interface RadarChartProps {
  scores: {
    accuracy: number;
    latency: number;
    reliability: number;
    ease_of_use: number;
    cost_efficiency: number;
  };
}

export default function RadarChart({ scores }: RadarChartProps) {
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;
  
  const points = [
    { label: 'Accuracy', val: scores.accuracy },
    { label: 'Latency', val: scores.latency },
    { label: 'Reliability', val: scores.reliability },
    { label: 'UX', val: scores.ease_of_use },
    { label: 'Value', val: scores.cost_efficiency },
  ];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2;
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = points
    .map((p, i) => {
      const { x, y } = getPoint(i, p.val);
      return `${x},${y}`;
    })
    .join(' ');

  const gridPoints = [2, 4, 6, 8, 10].map((level) => {
    return points
      .map((_, i) => {
        const { x, y } = getPoint(i, level);
        return `${x},${y}`;
      })
      .join(' ');
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid lines */}
        {gridPoints.map((gp, i) => (
          <polygon
            key={i}
            points={gp}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
        ))}
        
        {/* Axis lines */}
        {points.map((_, i) => {
          const { x, y } = getPoint(i, 10);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="var(--color-accent)"
          fillOpacity="0.3"
          stroke="var(--color-accent)"
          strokeWidth="2"
        />

        {/* Labels */}
        {points.map((p, i) => {
          const { x, y } = getPoint(i, 11);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[8px] font-mono uppercase tracking-tighter fill-current opacity-60"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
