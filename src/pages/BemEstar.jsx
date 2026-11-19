import { Bar, Chip, SectionTitle, Stat } from '../ui.jsx'
import { db, byId, metricsAluno } from '../data.js'

export default function BemEstar({ aluno }) {
  const b = byId(db.wellbeing, aluno.id)
  const zona = byId(db.hrZones, aluno.id)
  const m = metricsAluno(aluno.id)
  if (!b) return <p className="text-zinc-400">Sem dados de bem-estar.</p>

  const sonoPct = (Number(b.horasdesonom_dianoite) / 8) * 100
  const agua = Number(b.ingest_ode_guarecomendadaldia)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Sono"
          value={`${b.horasdesonom_dianoite}h`}
          sub={b.classifica_odosono}
          tone={Number(b.horasdesonom_dianoite) >= 7 ? 'text-lime-300' : 'text-yellow-300'}
        />
        <Stat label="Qualidade do sono" value={`${b.qualidadedosono15}/5`} sub={b.classifica_odosono.replace(/^\S+\s/, '')} />
        <Stat label="Estresse" value={`${b.n_veldeestresse010}/10`} sub={b.classifica_odoestresse.replace(/^\S+\s/, '')} />
        <Stat label="Adesão ao programa" value={`${Math.round(m.adesao * 100)}%`} sub={`${m.presencas}/${m.total} sessões`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <SectionTitle>Metabolismo e hidratação</SectionTitle>
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 flex justify-between"><span>Meta de água por dia</span><b className="text-sky-300">{agua} L</b></div>
              <Bar pct={Math.min(100, agua * 12.5)} className="bg-sky-500" />
              <p className="mt-1 text-xs text-zinc-500">Referência: 35 ml por kg de peso corporal/dia.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="text-xs text-zinc-500">TMB (Mifflin-St Jeor)</div>
                <div className="mt-0.5 text-lg font-bold text-lime-300">{b.tmbtaxametab_licabasalkcaldia} kcal/dia</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="text-xs text-zinc-500">Gasto calórico total</div>
                <div className="mt-0.5 text-lg font-bold text-lime-300">{b.gastocal_ricototalestimadokcaldia} kcal/dia</div>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Fator de atividade aplicado: {b.fatordeatividade} ({b.n_veldeatividade.toLowerCase()}).
            </p>
          </div>
        </div>

        <div className="card">
          <SectionTitle>Recuperação</SectionTitle>
          <div className="space-y-3 text-sm">
            <p className="text-zinc-300">{b.classifica_odosono} · {b.classifica_odoestresse}</p>
            <div>
              <div className="mb-1 flex justify-between"><span>Horas de sono (meta 8h)</span><span>{b.horasdesonom_dianoite}h</span></div>
              <Bar pct={sonoPct} className={Number(b.horasdesonom_dianoite) >= 7 ? 'bg-lime-500' : 'bg-yellow-500'} />
            </div>
            <div>
              <div className="mb-1 flex justify-between"><span>Qualidade do sono</span><span>{b.qualidadedosono15}/5</span></div>
              <Bar pct={(Number(b.qualidadedosono15) / 5) * 100} />
            </div>
            {zona && (
              <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
                Sua zona de FC alvo para <b className="text-zinc-200">{zona.objetivo}</b> é {zona.fcalvom_nimabpm}–{zona.fcalvom_ximabpm} bpm.
                Dormir e se hidratar bem ajuda a manter a recuperação adequada entre sessões.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <SectionTitle>Avisos do studio</SectionTitle>
        <ul className="space-y-2 text-sm">
          {db.notices.map((n) => (
            <li key={n.ordem} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5">{n.mensagem}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
