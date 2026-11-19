import { Bar, Chip, SectionTitle, Stat } from '../ui.jsx'
import { metricsAluno, sessionHoje, xpProNivel, db, byId } from '../data.js'

const ICONE_HEROI = {
  Recruta: '🦸',
  Sentinela: '🛡️',
  'Guardião': '⚔️',
  'Titã': '⚡',
  'Lenda Suprema': '👑',
}

export default function Home({ aluno }) {
  const m = metricsAluno(aluno.id)
  const nivel = xpProNivel(m.xpTotal)
  const prog = nivel.teto ? ((m.xpTotal - nivel.base) / (nivel.teto - nivel.base)) * 100 : 100
  const { dia, alvo } = sessionHoje(String(aluno.semanaCorrente || 1))
  const semanasPerfeitas = byId(db.weeklyPerfect, aluno.id)?.totalsemanasperfeitas ?? 0
  const zona = byId(db.hrZones, aluno.id)
  const bem = byId(db.wellbeing, aluno.id)

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 text-4xl">
          {ICONE_HEROI[nivel.atual.avatarher_i] || '🦸'}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black">Olá, {aluno.nomecompleto.split(' ')[0]}!</h1>
            <Chip tone="green">{nivel.atual.n_vel}</Chip>
          </div>
          <p className="mt-1 text-sm text-zinc-400">{nivel.atual.descri_odoavatar}</p>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-zinc-400">
              <span>{m.xpTotal} XP</span>
              <span>{nivel.prox ? `próximo: ${nivel.prox.avatarher_i} (${nivel.prox.xpm_nimo} XP)` : 'nível máximo!'}</span>
            </div>
            <Bar pct={prog} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Posição no Ranking" value={`${m.posNoRanking ?? '—'}º`} sub={`Adesão ${Math.round(m.adesao * 100)}%`} />
        <Stat label="XP Total" value={m.xpTotal} sub={`${m.presencas} sessões presenciadas`} />
        <Stat label="Semanas 100%" value={semanasPerfeitas} sub="presença perfeita" />
        <Stat label="Tempo de Treino" value={`${Math.round(m.minutos / 60)}h`} sub={`streak atual: ${m.streakAtual} sessões`} />
      </div>

      <div className="card">
        <SectionTitle right={dia ? <Chip tone="green">{(dia.fase || '').split('–')[0]}</Chip> : null}>
          Treino de hoje · {alvo}
        </SectionTitle>
        {dia ? (
          <>
            <p className="text-sm text-zinc-300">{dia.objetivo_dia}</p>
            <div className="mt-3 space-y-2">
              {dia.blocos.map((b, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{b.exercicio}</div>
                    <div className="text-xs text-zinc-500">{b.bloco} · {b.padrao}</div>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <div className="text-zinc-200">{b.series} × {b.reps}</div>
                    <div>PSE {b.pse} · descanso {b.descanso}</div>
                  </div>
                </div>
              ))}
            </div>
            <a className="btn-ghost mt-4" href="#/treinos">Ver programa completo →</a>
          </>
        ) : (
          <p className="text-sm text-zinc-400">
            Hoje é domingo — dia de descanso. Hidrate-se
            {bem ? ` (meta de ${bem.ingest_ode_guarecomendadaldia} L/dia)` : ''} e permita que o corpo recupere.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <SectionTitle>XP por semana</SectionTitle>
          <div className="flex h-36 items-end gap-2">
            {Object.entries(m.porSemana).map(([sem, v]) => {
              const max = Math.max(...Object.values(m.porSemana).map((s) => s.xp), 1)
              return (
                <div key={sem} className="flex flex-1 flex-col items-center gap-1">
                  <div className="text-[10px] text-zinc-500">{v.xp}</div>
                  <div className="w-full rounded-t-lg bg-lime-500/80" style={{ height: `${(v.xp / max) * 100}%` }} />
                  <div className="text-[10px] text-zinc-500">S{sem}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <SectionTitle>Zona de FC do seu objetivo</SectionTitle>
          {zona ? (
            <>
              <p className="text-sm text-zinc-300">{zona.zonadetreino}</p>
              <div className="mt-2 flex flex-wrap gap-6 text-sm">
                <div><span className="text-zinc-500">FC alvo:</span> <b className="text-lime-300">{zona.fcalvom_nimabpm}–{zona.fcalvom_ximabpm} bpm</b></div>
                <div><span className="text-zinc-500">Objetivo:</span> {zona.objetivo}</div>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-400">Zona não calculada — verifique a avaliação.</p>
          )}
          <a className="btn-ghost mt-4" href="#/bem-estar">Ver bem-estar →</a>
        </div>
      </div>
    </div>
  )
}
