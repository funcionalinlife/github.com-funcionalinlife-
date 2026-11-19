import { useState } from 'react'
import { Bar, Chip, SectionTitle } from '../ui.jsx'
import { db, byId } from '../data.js'

const ABAS = ['Antropometria', 'Funcional', 'Anamnese', 'Movimento', 'Multifuncional', 'T.A.S.V.M.']

export default function Avaliacoes({ aluno }) {
  const [aba, setAba] = useState('Antropometria')
  const ant = byId(db.anthropometry, aluno.id)
  const fn = byId(db.functional, aluno.id)
  const an = byId(db.anamnesis, aluno.id)
  const tz = byId(db.tasvmStudents, aluno.id)
  const ms = byId(db.movementSummary, aluno.id)
  const mov = db.movementTests.filter((t) => Number(t.id) === Number(aluno.id))
  const mf = db.multifunctionalRecords.filter((t) => Number(t.id) === Number(aluno.id))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              aba === a ? 'border-lime-500 bg-lime-500/10 text-lime-300' : 'border-zinc-700 text-zinc-400 hover:border-lime-500/50'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {aba === 'Antropometria' && ant && (
        <div className="card">
          <SectionTitle right={<Chip>{ant.datadaavalia_o}</Chip>}>Antropometria e sinais vitais</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ['Peso', `${ant.pesokg} kg`], ['Altura', `${ant.alturam} m`],
              ['IMC', `${ant.imckgm} — ${ant.classifica_oimc}`],
              ['% Gordura', `${ant.gorduracorporal}%`],
              ['Cintura', `${ant.circcinturacm} cm`], ['Quadril', `${ant.circquadrilcm} cm`],
              ['RCQ', `${ant.rcq} — ${ant.classifica_oriscocard_acorcq}`],
              ['PA', `${ant.pasist_licammhg}/${ant.padiast_licammhg} mmHg`],
              ['Duplo Produto', `${ant.duploprodutofcrepousoxpas}`],
              ['FC Repouso', `${ant.fcrepousobpm} bpm`],
              ['FC Basal', `${ant.frequ_nciabasalbpm} bpm`],
              ['Recuperação', ant.classifica_oderecupera_o],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="text-xs text-zinc-500">{k}</div>
                <div className="mt-0.5 text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm">{ant.classifica_oduploprodutopodetreinar}</div>
        </div>
      )}

      {aba === 'Funcional' && fn && (
        <div className="card">
          <SectionTitle right={<Chip>{fn.data}</Chip>}>Avaliação funcional</SectionTitle>
          <table className="data">
            <thead>
              <tr><th>Teste</th><th>Resultado</th></tr>
            </thead>
            <tbody>
              {[
                ['Teste de Agachamento (FMS 1-3)', fn.testedeagachamentofms13],
                ['Sentar e Alcançar', `${fn.sentarealcan_arcm} cm`],
                ['Equilíbrio Unipodal', `${fn.equil_briounipodals} s`],
                ['Prancha Ventral', `${fn.pranchaventrals} s`],
                ['1RM Estimado Supino', `${fn['1rmestimadosupinokg']} kg`],
                ['1RM Estimado Agachamento', `${fn['1rmestimadoagachamentokg']} kg`],
                ['Caminhada 6 min', `${fn.testedecaminhada6minm} m`],
                ['Push-ups em 1 min', `${fn.pushupsem1minrep} rep`],
              ].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td className="font-semibold text-lime-300">{v}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-zinc-400">Observações: {fn.observa_es}</p>
        </div>
      )}

      {aba === 'Anamnese' && an && (
        <div className="card">
          <SectionTitle right={<Chip tone={an['libera_om_dica'].toLowerCase() === 'sim' ? 'green' : 'red'}>
            Liberação médica: {an['libera_om_dica']}
          </Chip>}>Anamnese</SectionTitle>
          <table className="data">
            <tbody>
              {[
                ['Doenças pré-existentes', an.doen_aspr_existentes],
                ['Cirurgias prévias', an.cirurgiaspr_vias],
                ['Lesões musculoesqueléticas', an.les_esmusculoesquel_ticas],
                ['Medicamentos em uso', an.medicamentosemuso],
                ['Histórico familiar', an.hist_ricofamiliarrelevante],
                ['Nível de atividade', an.n_veldeatividadeatual],
                ['Fumante', an.fumante],
                ['Consumo de álcool', an.consumode_lcool],
                ['Horas de sono/noite', an.horasdesononoite],
                ['Nível de estresse (1-5)', an.n_veldeestresse15],
                ['Restrições / contraindicações', an.restri_escontraindica_es],
              ].map(([k, v]) => (
                <tr key={k}><td className="w-64 text-zinc-400">{k}</td><td className="font-medium">{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'Movimento' && (
        <div className="card">
          <SectionTitle right={ms ? <Chip tone={ms.n_veldecompensa_o.includes('Alto') ? 'red' : ms.n_veldecompensa_o.includes('Moderado') ? 'yellow' : 'green'}>
            {ms.n_veldecompensa_o} — {ms.totaldecompensa_esobservadas} compensações
          </Chip> : null}>Avaliação do movimento (8 testes)</SectionTitle>
          <div className="space-y-2">
            {mov.map((t, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip>{t.pilar}</Chip>
                  <span className="font-semibold">{t.teste}</span>
                  <span className="ml-auto text-xs text-zinc-500">Teste {t.teste_n}/8</span>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  <b className="text-zinc-300">Compensações:</b> {t.flags.length ? t.flags.join(', ') : 'nenhuma identificada'}
                </div>
                <div className="mt-1 text-xs text-zinc-400"><b className="text-zinc-300">Problema:</b> {t.problema}</div>
                <div className="mt-1 text-xs text-lime-400/80"><b>Correção:</b> {t.correcao}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'Multifuncional' && (
        <div className="space-y-4">
          <div className="card">
            <SectionTitle>Check-list multifuncional (Guiselini)</SectionTitle>
            {(() => {
              const resumo = byId(db.multifunctionalSummary, aluno.id)
              const max = Math.max(...db.multifunctionalSummary.map((r) => r.itens_com_compensacao), 1)
              return (
                <>
                  <p className="text-sm text-zinc-400">
                    Itens com compensação: <b className="text-lime-300">{resumo.itens_com_compensacao}</b> de {mf.length} avaliados
                  </p>
                  <div className="mt-2"><Bar pct={(resumo.itens_com_compensacao / max) * 100} /></div>
                </>
              )
            })()}
          </div>
          <div className="card">
            <div className="max-h-96 overflow-y-auto">
              <table className="data">
                <thead>
                  <tr><th>Teste</th><th>Região</th><th>Item observado</th><th>Lado</th><th>Resultado</th></tr>
                </thead>
                <tbody>
                  {mf.map((r, i) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap">{r.teste}</td>
                      <td>{r.regiao}</td>
                      <td>{r.item}</td>
                      <td>{r.lado}</td>
                      <td>{String(r.classificacao).includes('Sobreposto') || String(r.valor) === 'S' ? r.classificacao || 'S' : `${r.valor ?? ''} ${r.classificacao}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {aba === 'T.A.S.V.M.' && tz && (
        <div className="card">
          <SectionTitle right={<Chip>{tz.classifica_odeequil_brio}</Chip>}>Equilíbrio T.A.S.V.M. (0–6 por pilar)</SectionTitle>
          <div className="space-y-3">
            {[
              ['T — Técnica', tz.tt_cnica06],
              ['A — Amplitude', tz.aamplitude06],
              ['S — Sobrecarga', tz.ssobrecarga06],
              ['V — Variabilidade', tz.vvariabilidade06],
              ['M — Métodos', tz.mm_todos06],
            ].map(([label, v]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="text-zinc-300">{v}/6</span></div>
                <Bar pct={(v / 6) * 100} className={v >= 4 ? 'bg-lime-500' : v >= 2.5 ? 'bg-yellow-500' : 'bg-red-500/80'} />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
            <div><b className="text-zinc-300">Média:</b> {tz.m_dia} · <b className="text-zinc-300">Desvio:</b> {tz.desvioequil_brio}</div>
            <div className="mt-1 text-zinc-400"><b className="text-zinc-300">Sintoma provável:</b> {tz.sintomaprov_vel}</div>
            <div className="mt-1 text-lime-400/80"><b>Foco recomendado:</b> {tz.focodecorre_orecomendado}</div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">{tz.comopreencher}</p>
        </div>
      )}
    </div>
  )
}
