import { Chip, SectionTitle } from '../ui.jsx'
import { db, byId } from '../data.js'

export default function Saude({ aluno }) {
  const s = byId(db.metabolicScreening, aluno.id)
  const ant = byId(db.anthropometry, aluno.id)
  const an = byId(db.anamnesis, aluno.id)
  if (!s) return <p className="text-zinc-400">Sem triagem metabólica registrada.</p>

  const risco = String(s.classifica_oderiscogeral || '')
  const tone = risco.includes('Alto') ? 'red' : risco.includes('Moderado') ? 'yellow' : 'green'
  const diag = String(s.diagn_sticoncep || '').includes('S') || String(s.diagn_sticoidf || '').includes('S')

  return (
    <div className="space-y-6">
      <div className="card">
        <SectionTitle right={<Chip tone={tone}>{risco}</Chip>}>Triagem metabólica</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Cintura', `${s.cinturacm} cm`],
            ['Triglicerídeos', `${s.triglicer_deosmgdl} mg/dL — ${s.classiftg}`],
            ['Glicemia jejum', `${s.glicemiajejummgdl} mg/dL — ${s.classifglicemia}`],
            ['PA', `${s.pasmmhg}/${s.padmmhg} mmHg`],
            ['HDL', `${s.hdlmgdl} mg/dL`],
            ['IMC', `${s.imc}`],
            ['Duplo Produto', `${s.duploproduto}`],
            ['Critérios NCEP', `${s.n_crit_riosncep}/5`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-xs text-zinc-500">{k}</div>
              <div className="mt-0.5 text-sm font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip tone={String(s.diagn_sticoncep).includes('✅') ? 'red' : 'green'}>{s.diagn_sticoncep}</Chip>
          <Chip tone={String(s.diagn_sticoidf).includes('✅') ? 'red' : 'green'}>{s.diagn_sticoidf}</Chip>
          <Chip tone="green">{s.libera_ocardiovascular}</Chip>
        </div>
        <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
          <b className="text-zinc-100">Recomendações de segurança: </b>{s.recomenda_esdeseguran_a}
        </p>
      </div>

      {an && (
        <div className="card">
          <SectionTitle>Restrições e contraindicações</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
              <div className="text-xs font-semibold uppercase text-zinc-500">Condições</div>
              <ul className="mt-2 space-y-1">
                <li>Doenças: {an.doen_aspr_existentes}</li>
                <li>Medicamentos: {an.medicamentosemuso}</li>
                <li>Liberação médica: {an.libera_om_dica}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-yellow-800/50 bg-yellow-900/10 p-4 text-sm">
              <div className="text-xs font-semibold uppercase text-yellow-500/90">Cuidados no treino</div>
              <p className="mt-2 text-yellow-200/90">{an.restri_escontraindica_es}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <SectionTitle>Segurança cardiovascular — referências</SectionTitle>
        <table className="data">
          <tbody>
            {[
              ['Duplo Produto (FC Repouso × PAS)', '< 28.000 → libera-se para a prática'],
              ['Cancelar treino se PA não controlada', 'PAS ≥ 180 mmHg ou PAD ≥ 110 mmHg'],
              ['Prudente durante o exercício', 'PAS ≤ 220 mmHg e PAD ≤ 105 mmHg'],
              ['Betabloqueadores', 'Reduzem FC e VO2max — usar PSE em vez de FC'],
              ['Diuréticos', 'Garantir hidratação nas semanas iniciais'],
              ['Idosos', 'Volta à calma mais longa; atenção a hipotensão e síncope'],
            ].map(([k, v]) => (
              <tr key={k}><td className="w-72 text-zinc-400">{k}</td><td className="font-medium">{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-zinc-500">
          Critérios NCEP-ATP III / IDF para síndrome metabólica (≥3 de 5 critérios; cintura obrigatória na IDF).
          A triagem do portal não substitui avaliação cardiológica.
        </p>
      </div>
    </div>
  )
}
