const SIZE = 140;
const CENTER = SIZE / 2;
const RADIUS = 52;

const AXES = [
  { label: 'Win Rate', angle: -90 },
  { label: 'Vitesse', angle: 30 },
  { label: 'Mémoire', angle: 150 },
];

function polarToCart(angleDeg, r) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

export default function RadarChart({ winRate, speed, memory }) {
  const values = [winRate, speed, memory];

  // Grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = AXES.map((axis, i) => {
    const r = values[i] * RADIUS;
    return polarToCart(axis.angle, r);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = AXES.map((axis) => polarToCart(axis.angle, RADIUS * level));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
        return <path key={level} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}

      {/* Axis lines */}
      {AXES.map((axis, i) => {
        const end = polarToCart(axis.angle, RADIUS);
        return <line key={i} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(250, 204, 21, 0.2)" stroke="#facc15" strokeWidth="2" />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#facc15" />
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
            fill="rgba(255,255,255,0.4)"
            fontSize="8"
            fontFamily="DM Mono, monospace"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
