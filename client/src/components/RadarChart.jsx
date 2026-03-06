const SIZE = 140;
const CENTER = SIZE / 2;
const RADIUS = 48;

const AXES = [
  { label: 'Win Rate', angle: -90 },
  { label: 'Vitesse', angle: 90 },
];

function polarToCart(angleDeg, r) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

export default function RadarChart({ winRate, speed }) {
  const values = [winRate, speed];

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = AXES.map((axis, i) => {
    const r = values[i] * RADIUS;
    return polarToCart(axis.angle, r);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* Grid circles */}
      {gridLevels.map((level) => (
        <circle
          key={level}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS * level}
          fill="none"
          stroke="rgba(79, 70, 229, 0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {AXES.map((axis, i) => {
        const end = polarToCart(axis.angle, RADIUS);
        return <line key={i} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="rgba(79, 70, 229, 0.12)" strokeWidth="1" />;
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(79, 70, 229, 0.1)" stroke="#4F46E5" strokeWidth="2" strokeLinejoin="round" />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#4F46E5" stroke="white" strokeWidth="2" />
      ))}

      {/* Labels */}
      {AXES.map((axis, i) => {
        const pos = polarToCart(axis.angle, RADIUS + 18);
        return (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#94A3B8"
            fontSize="9"
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
