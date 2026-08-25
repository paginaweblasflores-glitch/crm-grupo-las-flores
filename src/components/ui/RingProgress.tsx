export function RingProgress({
  value,
  size = 120,
  stroke = 12,
  color = "var(--color-terracota)",
  track = "var(--color-crema-oscuro)",
  label,
  sublabel,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-[var(--color-gris)]">{label ?? `${value}%`}</span>
        {sublabel && <span className="text-[10px] text-[var(--color-gris-medio)]">{sublabel}</span>}
      </div>
    </div>
  );
}
