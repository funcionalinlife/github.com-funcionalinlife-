import { useEffect, useMemo, useRef, useState } from 'react'
import { Chip, SectionTitle } from '../ui.jsx'
import { db, byId, metricsAluno, todosAlunos } from '../data.js'
import { downloadCSV } from '../exportUtils.js'

const fmt = (ms) => {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Cronometro() {
  const [cron, setCron] = useState(() => JSON.parse(localStorage.getItem('portal_cron') || 'null'))
  const [hist, setHist] = useState(() => JSON.parse(localStorage.getItem('portal_cron_hist') || '[]'))
  const [agora, setAgora] = useState(Date.now())
  const ref = useRef(null)

  useEffect(() => {
    if (!cron) return undefined
    ref.current = setInterval(() => setAgora(Date.now()), 500)
    return () => clearInterval(ref.current)
  }, [cron])

  const salvar = (c, h) => {
    setCron(c)
    setHist(h)
    localStorage.setItem('portal_cron', JSON.stringify(c))
    localStorage.setItem('portal_cron_hist', JSON.stringify(h))
  }

  const iniciar = () => salvar({ inicio: Date.now() }, hist)
  const finalizar = () => {
    const minutos = Math.max(1, Math.round((Date.now() - cron.inicio) / 60000))
    salvar(null, [...hist, { n: hist.length + 1, inicio: new Date(cron.inicio).toLocaleTimeString('pt-BR'), fim: new Date().toLocaleTimeString('pt-BR'), minutos }])
  }
  const limpar = () => salvar(null, [])

  const copiarTabela = () => {
    const linhas = ['Sessão\tAluno\tDuração (min)']
    for (const a of db.students) linhas.push(`\t${a.nomecompleto}\t`)
    navigator.clipboard.writeText(linhas.join('\n'))
    alert('Tabela copiada! Cole na coluna D da aba Frequencia_XP e preencha a Duração da última sessão (' + hist[hist.length - 1]?.minutos + ' min) apenas para os alunos presentes.')
  }

  const baixarCSV = () =>
    downloadCSV('duracao_sessoes.csv', ['Sessão', 'Início', 'Fim', 'Duração (min)'], hist.map((h) => [h.n, h.inicio, h.fim, h.minutos]))

  const emAndamento = cron ? fmt(agora - cron.inicio) : null

  return (
    <div className="card">
      <SectionTitle>⏱️ Cronômetro de sessão</SectionTitle>
      <div className="flex flex-wrap items-center gap-4">
        <div className="font-mono text-4xl font-bold text-lime-300">
          {cron ? emAndamento : '00:00'}
        </div>
        {cron ? (
          <button className="btn-primary" onClick={finalizar}>Finalizar sessão</button>
        ) : (
          <button className="btn-primary" onClick={iniciar}>Iniciar sessão</button>
        )}
        <button className="btn-ghost" onClick={copiarTabela} disabled={!hist.length}>📋 Copiar tabela (colar na planilha)</button>
        <button className="btn-ghost" onClick={baixarCSV} disabled={!hist.length}>⬇️ Durações (CSV)</button>
        <button className="btn-ghost" onClick={limpar} disabled={!hist.length}>Limpar histórico</button>
      </div>
      {hist.length > 0 && (
        <table className="data mt-4 max-w-md">
          <thead><tr><th>Sessão</th><th>Início</th><th>Fim</th><th>Duração</th></tr></thead>
          <tbody>
            {hist.slice().reverse().map((h) => (
              <tr key={h.n}><td>{h.n}</td><td>{h.inicio}</td><td>{h.fim}</td><td>{h.minutos} min</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        O tempo não grava direto no .xlsx: copie a tabela e cole a duração na coluna 'Duração da Sessão (min)'
        da aba Frequencia_XP (mesmo fluxo do dashboard original).
      </p>
    </div>
  )
}

const MASCI = (s, k, def = '—') => {
  const v = String((s && s[k]) || '')
  if (v.includes('Alto') || v.includes('✅') || v.includes('🔴')) return 'red'
  if (v.includes('Moderado') || v.includes('⚠') || v.includes('🟡')) return 'yellow'
  return def === '—' ? 'green' : def
}

const riscoFlags = (a) => {
  const s = byId(db.metabolicScreening, a.id) || {}
  const ant = byId(db.anthropometry, a.id) || {}
  const m = metricsAluno(a.id)
  return {
    risco: String(s.classifica_oderiscogeral || '').includes('Alto'),
    fadiga: String(ant.classifica_oderecupera_o || '').includes('Possível'),
    dp: String(ant.classifica_oduploprodutopodetreinar || '').includes('🔴'),
    adesao: (m.adesao ?? 1) < 0.8,
  }
}

function RevisaoRegistros() {
  const [revisoes, setRevisoes] = useState(() => JSON.parse(localStorage.getItem('portal_revisoes') || '{}'))

  const registros = todosAlunos().map((a) => {
    const feitos = JSON.parse(localStorage.getItem(`portal_feitos_${a.id}`) || '{}')
    const grupos = {}
    for (const key of Object.keys(feitos)) {
      if (!feitos[key]) continue
      const [semana, dia] = key.split('-')
      const g = `S${semana} · D${Number(dia) + 1}`
      grupos[g] = (grupos[g] || 0) + 1
    }
    return { aluno: a, total: Object.values(grupos).reduce((x, y) => x + y, 0), det: Object.keys(grupos).join(', ') }
  })

  const salvarRev = (id, status, nota = '') => {
    const novas = { ...revisoes }
    if (!status) delete novas[id]
    else novas[id] = { status, quando: new Date().toLocaleString('pt-BR'), nota }
    setRevisoes(novas)
    localStorage.setItem('portal_revisoes', JSON.stringify(novas))
  }

  const corrigir = (r) => {
    if (!window.confirm(`Corrigir marcações de ${r.aluno.nomecompleto}? Isso limpa os exercícios marcados como concluídos.`)) return
    localStorage.setItem(`portal_feitos_${r.aluno.id}`, '{}')
    salvarRev(r.aluno.id, 'corrigido', 'Marcações limpas pelo instrutor')
  }

  const aprovados = Object.values(revisoes).filter((x) => x.status === 'aprovado').length
  const corrigidos = Object.values(revisoes).filter((x) => x.status === 'corrigido').length

  return (
    <div className="card overflow-x-auto">
      <SectionTitle right={<div className="flex gap-2"><Chip tone="green">✅ {aprovados} aprovados</Chip><Chip tone="yellow">✏️ {corrigidos} corrigidos</Chip></div>}>
        Revisão de registros dos alunos
      </SectionTitle>
      <table className="data min-w-[760px]">
        <thead>
          <tr><th>#</th><th>Aluno</th><th>Exercícios marcados</th><th>Sessões</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {registros.map((r) => {
            const rev = revisoes[r.aluno.id]
            return (
              <tr key={r.aluno.id}>
                <td>{r.aluno.id}</td>
                <td className="whitespace-nowrap font-medium">{r.aluno.nomecompleto}</td>
                <td className="font-bold text-lime-300">{r.total}</td>
                <td className="text-xs text-zinc-400">{r.det || '—'}</td>
                <td>
                  <Chip tone={rev?.status === 'aprovado' ? 'green' : rev?.status === 'corrigido' ? 'yellow' : ''}>
                    {rev ? `${rev.status === 'aprovado' ? 'Aprovado' : 'Corrigido'} · ${rev.quando}` : 'Pendente'}
                  </Chip>
                  {rev?.nota && <div className="mt-1 text-xs text-zinc-500">{rev.nota}</div>}
                </td>
                <td className="whitespace-nowrap">
                  <div className="flex gap-1">
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => salvarRev(r.aluno.id, 'aprovado', `Aprovado em ${new Date().toLocaleDateString('pt-BR')}`)}>✅ Aprovar</button>
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => corrigir(r)}>✏️ Corrigir</button>
                    {rev && <button className="btn-ghost px-2 py-1 text-xs" onClick={() => salvarRev(r.aluno.id, null)}>↩️</button>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-zinc-500">
        Os registros listados são as marcações de exercícios feitas pelos alunos neste dispositivo (o portal é estático;
        para histórico compartilhado em nuvem, integrar um backend como Supabase/Firebase).
      </p>
    </div>
  )
}

export default function Instrutor() {
  const alunos = todosAlunos()
  const [filtro, setFiltro] = useState('todos')
  const flagsById = useMemo(() => Object.fromEntries(alunos.map((a) => [a.id, riscoFlags(a)])), [alunos])
  const FILTROS = [
    { k: 'todos', label: 'Todos' },
    { k: 'risco', label: '🫀 Risco alto' },
    { k: 'fadiga', label: '😴 Fadiga' },
    { k: 'dp', label: '❤️ DP elevado' },
    { k: 'adesao', label: '📉 Adesão < 80%' },
  ]
  const alunosRender = filtro === 'todos' ? alunos : alunos.filter((a) => flagsById[a.id][filtro])

  const cargaSemanal = useMemo(() => {
    const acc = {}
    for (const v of db.volumeLoad) acc[v.semana] = (acc[v.semana] || 0) + Number(v.volumeloadkg || 0)
    return [1, 2, 3, 4, 5, 6, 7, 8].map((semana) => ({ semana, kg: Math.round(acc[semana] || 0) }))
  }, [])
  const maxCarga = Math.max(...cargaSemanal.map((w) => w.kg), 1)
  const totalCarga = cargaSemanal.reduce((x, w) => x + w.kg, 0)

  const alertas = []
  for (const a of alunos) {
    const row = {
      a,
      m: metricsAluno(a.id),
      ant: byId(db.anthropometry, a.id),
      an: byId(db.anamnesis, a.id),
      s: byId(db.metabolicScreening, a.id),
      tasvm: byId(db.tasvmStudents, a.id),
      rec: byId(db.anthropometry, a.id)?.classifica_oderecupera_o || '',
    }
    if ((row.s?.classifica_oderiscogeral || '').includes('Alto')) alertas.push({ aluno: a.nomecompleto, tipo: '🩺 Risco cardiovascular alto', det: row.s.recomenda_esdeseguran_a, tone: 'red' })
    if (row.rec.includes('Possível Fadiga')) alertas.push({ aluno: a.nomecompleto, tipo: '😮‍💨 Fadiga / overtraining', det: 'Diferença FC repouso × basal elevada — reduzir intensidade do treino do dia.', tone: 'red' })
    if ((row.ant?.classifica_oduploprodutopodetreinar || '').includes('🔴')) alertas.push({ aluno: a.nomecompleto, tipo: '❤️ Duplo produto elevado', det: 'Avaliar liberação cardiológica antes da próxima sessão.', tone: 'yellow' })
    if ((row.m.adesao ?? 1) < 0.8) alertas.push({ aluno: a.nomecompleto, tipo: '📉 Adesão abaixo de 80%', det: `Adesão atual: ${Math.round(row.m.adesao * 100)}% — contato de retenção recomendado.`, tone: 'yellow' })
  }

  const exportAlunos = () =>
    downloadCSV(
      'alunos.csv',
      ['ID', 'Nome', 'Sexo', 'Idade', 'E-mail', 'Objetivo', 'Turno', 'Horário', 'Avatar', 'XP Total', 'Semanas 100%', 'Ranking', 'Adesão %', 'Minutos treino'],
      alunos.map((a) => {
        const m = metricsAluno(a.id)
        return [a.id, a.nomecompleto, a.sexo, a.idade, a.email, a.objetivoprincipal, a.turnopreferido, a.hor_riopreferido, a.avataratual, m.xpTotal, a.semanascompresen_a100, a.posi_onoranking, Math.round(m.adesao * 100), m.minutos]
      }),
    )

  const exportRanking = () =>
    downloadCSV(
      'ranking.csv',
      ['Posição', 'ID', 'Nome', 'XP Total', 'Avatar/Nível', 'Semanas 100%', 'Adesão %', 'Objetivo'],
      db.ranking.map((r) => [r.posi_o, r.id, r.nome, r.xptotal, r.avatarn_vel, r.semanascpresen_a100, Math.round(Number(r.ades_o) * 100), r.objetivo]),
    )

  const exportSaude = () =>
    downloadCSV(
      'triagem_metabolica.csv',
      ['ID', 'Nome', 'IMC', 'Cintura cm', 'Triglicerídeos', 'Glicemia jejum', 'PA', 'HDL', 'Crit. NCEP', 'Diagnóstico NCEP', 'Diagnóstico IDF', 'Duplo Produto', 'Liberação', 'Risco geral'],
      db.metabolicScreening.map((s) => [s.id, s.nome, s.imc, s.cinturacm, s.triglicer_deosmgdl, s.glicemiajejummgdl, `${s.pasmmhg}/${s.padmmhg}`, s.hdlmgdl, s.n_crit_riosncep, s.diagn_sticoncep, s.diagn_sticoidf, s.duploproduto, s.libera_ocardiovascular, s.classifica_oderiscogeral]),
    )

  const exportFrequencia = () =>
    downloadCSV(
      'frequencia_xp.csv',
      ['Sessão', 'ID Aluno', 'Nome', 'Semana', 'Presença', 'Meta do dia', 'Zona FC', 'XP da sessão', 'Duração (min)'],
      db.attendance.map((f) => [f.sess_o, f.idaluno, f.nomedoaluno, f.semana, f.presen_asn, f.metadodiaatingidasn, f.zonadefcatingidasn, f.xpdasess_o, f.dura_odasess_omin]),
    )

  const exportVolume = () =>
    downloadCSV(
      'volume_load.csv',
      ['Sessão', 'Semana', 'ID Aluno', 'Nome', 'Bloco', 'Exercício', 'Séries', 'Reps', 'Carga kg', 'Volume Load kg', 'Densidade kg/min', 'Classificação'],
      db.volumeLoad.map((v) => [v.sess_o, v.semana, v.idaluno, v.nomedoaluno, v.bloco, v.exerc_cio, v.s_ries, v.repeti_esrealizadas, v.cargakg, v.volumeloadkg, v.densidadedetreinokgmin, v.classifica_odedensidade]),
    )

  return (
    <div className="space-y-6">
      <Cronometro />
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionTitle>Área do instrutor</SectionTitle>
          <p className="text-sm text-zinc-400">Visão geral dos {alunos.length} alunos do programa de 8 semanas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={exportAlunos}>⬇️ Alunos (CSV)</button>
          <button className="btn-ghost" onClick={exportRanking}>⬇️ Ranking (CSV)</button>
          <button className="btn-ghost" onClick={exportFrequencia}>⬇️ Frequência/XP (CSV)</button>
          <button className="btn-ghost" onClick={exportSaude}>⬇️ Triagem metabólica (CSV)</button>
          <button className="btn-ghost" onClick={exportVolume}>⬇️ Volume Load (CSV)</button>
          <button className="btn-primary" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="card">
          <SectionTitle>Alertas de saúde e adesão</SectionTitle>
          <div className="space-y-2">
            {alertas.map((al, i) => (
              <div key={i} className={`rounded-xl border p-3 text-sm ${al.tone === 'red' ? 'border-red-800/60 bg-red-900/10' : 'border-yellow-800/50 bg-yellow-900/10'}`}>
                <span className="font-semibold">{al.tipo}</span> — <span className="text-zinc-300">{al.aluno}</span>
                <div className="mt-1 text-xs text-zinc-400">{al.det}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <SectionTitle>Carga semanal do programa (volume load)</SectionTitle>
        <div className="flex h-44 items-end gap-2">
          {cargaSemanal.map((w) => (
            <div key={w.semana} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-semibold text-zinc-400">{(w.kg / 1000).toFixed(1)}t</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-lime-800 to-lime-400 transition-all"
                style={{ height: `${Math.max(2, (w.kg / maxCarga) * 82)}%` }}
                title={`Semana ${w.semana}: ${w.kg.toLocaleString('pt-BR')} kg`}
              />
              <span className="text-xs text-zinc-500">S{w.semana}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Volume load total (kg levantados) de todos os {alunos.length} alunos por semana, conforme a aba Volume_Load.
          Total do programa: {(totalCarga / 1000).toFixed(1)} toneladas.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>Painel de alunos</SectionTitle>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.k}
                onClick={() => setFiltro(f.k)}
                className={`chip transition ${filtro === f.k ? 'border-lime-600 bg-lime-900/40 text-lime-200' : 'text-zinc-400'}`}
              >
                {f.label} {f.k !== 'todos' && `(${alunos.filter((a) => flagsById[a.id][f.k]).length})`}
              </button>
            ))}
          </div>
        </div>
        {alunosRender.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">🎉 Nenhum aluno neste filtro.</p>
        ) : (
        <table className="data min-w-[900px]">
          <thead>
            <tr>
              <th>#</th><th>Aluno</th><th>Objetivo</th><th>Turno</th><th>XP</th>
              <th>Adesão</th><th>Ranking</th><th>PA / Duplo Produto</th><th>Recuperação</th><th>Sind. Metab.</th><th>T.A.S.V.M.</th>
            </tr>
          </thead>
          <tbody>
            {alunosRender.map((a) => {
              const m = metricsAluno(a.id)
              const ant = byId(db.anthropometry, a.id)
              const s = byId(db.metabolicScreening, a.id)
              const tasvm = byId(db.tasvmStudents, a.id)
              const risco = s?.classifica_oderiscogeral || ''
              const eq = tasvm?.classifica_odeequil_brio || ''
              return (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td className="whitespace-nowrap font-medium">{a.nomecompleto}</td>
                  <td className="max-w-40 truncate text-zinc-400">{a.objetivoprincipal}</td>
                  <td className="whitespace-nowrap text-zinc-400">{a.turnopreferido} · {a.hor_riopreferido}</td>
                  <td className="font-bold text-lime-300">{m.xpTotal}</td>
                  <td>{Math.round(m.adesao * 100)}%</td>
                  <td>{a.posi_onoranking}º</td>
                  <td className="whitespace-nowrap">
                    {ant ? `${ant.pasist_licammhg}/${ant.padiast_licammhg} mmHg · DP ${ant.duploprodutofcrepousoxpas}` : '—'}
                  </td>
                  <td className="text-xs">{ant?.classifica_oderecupera_o || '—'}</td>
                  <td><Chip tone={MASCI(s, 'classifica_oderiscogeral')}>{risco.replace(/🔴|🟡|🟢/g, '').trim() || '—'}</Chip></td>
                  <td><Chip tone={eq.includes('Desequilibrado') && !eq.includes('Moderadamente') ? 'red' : eq.includes('Moderadamente') ? 'yellow' : 'green'}>{eq.replace(/🔴|🟡|🟢/g, '').trim() || '—'}</Chip></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        )}
      </div>

      <RevisaoRegistros />
    </div>
  )
}
