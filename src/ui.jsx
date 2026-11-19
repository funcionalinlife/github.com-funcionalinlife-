export function Stat({ label, value, sub, tone = 'text-lime-300' }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-400">{sub}</div>}
    </div>
  )
}

export function Bar({ pct, className = 'bg-lime-500' }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}

export function Delta({ value, unit = '', goodWhenDown = false }) {
  if (value === null || value === undefined || isNaN(value)) return <span className="text-zinc-500">—</span>
  const good = goodWhenDown ? value < 0 : value > 0
  const neutral = value === 0
  return (
    <span className={neutral ? 'text-zinc-400' : good ? 'text-lime-400' : 'text-red-400'}>
      {value > 0 ? '+' : ''}{Math.round(value * 100) / 100}{unit}
    </span>
  )
}

export function Chip({ children, tone = '' }) {
  const tones = {
    green: 'border-lime-700/60 bg-lime-900/30 text-lime-300',
    yellow: 'border-yellow-700/60 bg-yellow-900/30 text-yellow-300',
    red: 'border-red-700/60 bg-red-900/30 text-red-300',
  }
  return <span className={`chip ${tones[tone] || ''}`}>{children}</span>
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-zinc-100">{children}</h2>
      {right}
    </div>
  )
}
