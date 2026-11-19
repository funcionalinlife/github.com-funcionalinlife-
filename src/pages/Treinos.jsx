import { useMemo, useState } from 'react'
import { Chip, SectionTitle } from '../ui.jsx'
import { DIAS, sessionHoje, db, youtubeLink } from '../data.js'

const FASES = [
  'Fase 1 – Estabilização e Resistência Muscular Localizada',
  'Fase 2 – Resistência de Força',
  'Fase 3 – Força Máxima',
  'Fase 4 – Potência Funcional',
]

export default function Treinos({ aluno }) {
  const { alvo } = sessionHoje('1')
  const hojeIdx = DIAS.indexOf(alvo)
  const [semana, setSemana] = useState(() => {
    const salvo = Number(localStorage.getItem(`portal_sem_${aluno.id}`))
    return salvo >= 1 && salvo <= 8 ? salvo : 1
  })
  const [diaSel, setDiaSel] = useState(() => (hojeIdx >= 0 ? hojeIdx : 0))
  const [feitos, setFeitos] = useState(() => JSON.parse(localStorage.getItem(`portal_feitos_${aluno.id}`) || '{}'))

  const salvar = (novos) => {
    setFeitos(novos)
    localStorage.setItem(`portal_feitos_${aluno.id}`, JSON.stringify(novos))
  }

  const sessoesSemana = useMemo(
    () => db.workoutPlan.filter((s) => Number(s.semana) === Number(semana)),
    [semana],
  )
  const fase = sessoesSemana[0]?.fase
  const sessao = sessoesSemana[diaSel]

  const feitosDaSessao = (blocos) => blocos.filter((_, i) => feitos[`${semana}-${diaSel}-${i}`]).length

  return (
    <div className="space-y-6">
      <div className="card">
        <SectionTitle>
          {fase || 'Programa'} · Semana {semana}
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSemana(s)
                localStorage.setItem(`portal_sem_${aluno.id}`, String(s))
              }}
              className={`h-9 w-14 rounded-lg border text-sm font-semibold transition ${
                Number(semana) === s
                  ? 'border-lime-500 bg-lime-500/15 text-lime-300'
                  : 'border-zinc-700 text-zinc-400 hover:border-lime-500/50'
              }`}
            >
              Sem {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DIAS.map((d, i) => {
            const s = sessoesSemana[i]
            const chaves = s?.blocos.map((_, bi) => `${semana}-${i}-${bi}`) || []
            const feitosDia = chaves.filter((k) => feitos[k]).length
            return (
              <button
                key={d}
                disabled={!s}
                onClick={() => setDiaSel(i)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition disabled:opacity-40 ${
                  diaSel === i ? 'border-lime-500 bg-lime-500/10 text-lime-200' : 'border-zinc-700 text-zinc-400 hover:border-lime-500/50'
                }`}
              >
                <div className="font-semibold">{d.replace('-feira', '')}</div>
                <div className="mt-0.5 text-zinc-500">
                  {feitosDia > 0 ? `${feitosDia}/${s?.blocos.length || 0} ✓` : s?.blocos.length || 0} exercícios
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {sessao && (
        <div className="card">
          <SectionTitle right={<Chip tone="green">{sessao.capacidade}</Chip>}>
            {sessao.dia} · {sessao.blocos.length} exercícios
          </SectionTitle>
          <p className="text-sm text-zinc-300">{sessao.objetivo_dia}</p>

          {['1', '2', '3', '4'].map((numBloco) => {
            const itens = sessao.blocos
              .map((b, i) => ({ ...b, i }))
              .filter((b) => String(b.bloco || '').startsWith(numBloco + ' -'))
            if (!itens.length) return null
            const duracao = itens[0].duracao_min
            return (
              <div key={numBloco} className="mt-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-lime-500/15 text-xs font-bold text-lime-300">
                    {numBloco}
                  </span>
                  <h3 className="text-sm font-bold">{itens[0].bloco}</h3>
                  <Chip>{duracao} min</Chip>
                </div>
                <div className="space-y-2">
                  {itens.map((b) => {
                    const key = `${semana}-${diaSel}-${b.i}`
                    const feito = !!feitos[key]
                    return (
                      <div
                        key={b.i}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                          feito ? 'border-lime-700/50 bg-lime-900/10' : 'border-zinc-800 bg-zinc-900'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-lime-500"
                          checked={feito}
                          onChange={() => salvar({ ...feitos, [key]: !feito })}
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${feito ? 'text-lime-300 line-through' : ''}`}>{b.exercicio}</div>
                          <div className="text-xs text-zinc-500">
                            {b.padrao}
                            {b.pse_class ? ` · PSE ${b.pse} (${b.pse_class.replace(/^\S+\s/, '')})` : ''}
                          </div>
                        </div>
                        <div className="text-right text-xs text-zinc-400">
                          <div className="text-zinc-200">{b.series} × {b.reps}</div>
                          <div>descanso {b.descanso}</div>
                        </div>
                        <a
                          className="chip hover:border-lime-500/60 hover:text-lime-300"
                          href={youtubeLink(b.exercicio)}
                          target="_blank"
                          rel="noreferrer"
                          title="Buscar vídeo de execução no YouTube"
                        >
                          ▶ vídeo
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <p className="mt-4 text-xs text-zinc-500">
            Progresso da sessão: {feitosDaSessao(sessao.blocos)}/{sessao.blocos.length} exercícios concluídos.
          </p>
        </div>
      )}
    </div>
  )
}
