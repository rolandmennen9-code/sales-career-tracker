export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="eyebrow">{label}</div>
      <div className="num mt-2 text-3xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}

/** Simple SVG bar chart for attainment by period, with a 100% quota line. */
export function AttainmentChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted">Add a performance record to see your attainment history.</p>;
  }
  const max = Math.max(150, ...data.map((d) => d.value)) * 1.08;
  const W = 640;
  const H = 220;
  const pad = { t: 16, b: 28, l: 36, r: 8 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const bw = Math.min(56, (innerW / data.length) * 0.6);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Quota attainment by period">
      {[0, 50, 100, 150].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t === 100 ? "0" : "2 4"} />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
            {t}%
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(100)} y2={y(100)} stroke="var(--ink)" strokeOpacity="0.35" />
      {data.map((d, i) => {
        const cx = pad.l + (innerW / data.length) * (i + 0.5);
        const hit = d.value >= 100;
        return (
          <g key={d.label}>
            <rect
              x={cx - bw / 2}
              y={y(d.value)}
              width={bw}
              height={Math.max(1, y(0) - y(d.value))}
              rx="4"
              fill={hit ? "var(--accent)" : "var(--muted)"}
              fillOpacity={hit ? 1 : 0.45}
            />
            <text x={cx} y={y(d.value) - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink)">
              {Math.round(d.value)}%
            </text>
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
