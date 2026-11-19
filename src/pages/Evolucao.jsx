import { Bar, Chip, Delta, SectionTitle } from '../ui.jsx'
import { db, byId } from '../data.js'

export default function Evolucao({ aluno }) {
  const ev = byId(db.evolution, aluno.id)
  if (!ev) return <p className="text-zinc-400">Sem dados de evolução.</p>

  const itens = [
    { label: 'Peso', ini: ev.pesoin_cio, fim: ev.pesofinal, unit: ' kg', down: false },
    { label: 'IMC', ini: ev.imcin_cio, fim: ev.imcfinal, unit: '', down: false },
    { label: '% Gordura', ini: ev.gordin_cio, fim: ev.gordfinal, unit: ' p.p.', down: true },
    { label: 'Cintura', ini: ev.cinturain_cio, fim: ev.cinturafinal, unit: ' cm', down: true },
    { label: '1RM Supino', ini: ev.supinoin_cio, fim: ev.supinofinal, unit: ' kg', down: false },
    { label: '1RM Agachamento', ini: ev.agachin_cio, fim: ev.agachfinal, unit: ' kg', down: false },
    { label: 'Prancha', ini: ev.pranchain_cio, fim: ev.pranchafinal, unit: ' s', down: false },
    { label: 'Caminhada 6min', ini: ev.caminhadain_cio, fim: ev.caminhadafinal, unit: ' m', down: false },
    { label: 'FC Repouso', ini: ev.fcrepin_cio, fim: ev.fcrepfinal, unit: ' bpm', down: true },
  ]

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <SectionTitle>Evolução geral — Início × Semana 8</SectionTitle>
          <p className="text-sm text-zinc-400">
            Score de evolução (0–7): <b className="text-lime-300">{ev.scoreevolu_o07}/7</b>
          </p>
        </div>
        <Chip tone="green">{ev.evolu_ogeral}</Chip>
      </div>

      <div className="card">
        <SectionTitle>Marcadores físicos</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((it) => {
            const delta = Number(it.fim) - Number(it.ini)
            return (
              <div key={it.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{it.label}</span>
                  <span className="text-xs"><Delta value={delta} unit={it.unit} goodWhenDown={it.down} /></span>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {it.ini} → <b className="text-zinc-100">{it.fim}{it.unit}</b>
                </div>
                <div className="mt-2">
                  <Bar
                    pct={Math.min(100, (Math.abs(delta) / Math.max(1, Number(it.ini))) * 100 * 4)}
                    className={delta === 0 ? 'bg-zinc-600' : (it.down ? delta < 0 : delta > 0) ? 'bg-lime-500' : 'bg-red-500/80'}
                  />
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {it.down ? 'redução é evolução positiva' : 'aumento é evolução positiva'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
