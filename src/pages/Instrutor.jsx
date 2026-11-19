import { Chip, SectionTitle } from '../ui.jsx'
import { db, byId, metricsAluno } from '../data.js'
import { downloadCSV } from '../exportUtils.js'

const MASCI = (s, k, def = '—') => {
  const v = String(s[k] || '')
  if (v.includes('Alto') || v.includes('✅') || v.includes('🔴')) return 'red'
  if (v.includes('Moderado') || v.includes('⚠') || v.includes('🟡')) return 'yellow'
  return def === '—' ? 'green' : def
}

export default function Instrutor() {
  const alunos = db.students
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

      <div className="card overflow-x-auto">
        <SectionTitle>Painel de alunos</SectionTitle>
        <table className="data min-w-[900px]">
          <thead>
            <tr>
              <th>#</th><th>Aluno</th><th>Objetivo</th><th>Turno</th><th>XP</th>
              <th>Adesão</th><th>Ranking</th><th>PA / Duplo Produto</th><th>Recuperação</th><th>Sind. Metab.</th><th>T.A.S.V.M.</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => {
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
      </div>
    </div>
  )
}
