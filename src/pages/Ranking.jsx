import { Bar, Chip, SectionTitle } from '../ui.jsx'
import { db, metricsAluno, byId } from '../data.js'

export default function Ranking({ aluno }) {
  const m = metricsAluno(aluno.id)
  const maxXP = Math.max(...db.ranking.map((r) => Number(r.xptotal)), 1)
  const wp = byId(db.weeklyPerfect, aluno.id)
  const meuXP = db.attendance.filter((a) => Number(a.idaluno) === Number(aluno.id))

  return (
    <div className="space-y-6">
      <div className="card">
        <SectionTitle right={<Chip tone="green">Você: {m.posNoRanking ?? '—'}º lugar</Chip>}>
          Ranking geral
        </SectionTitle>
        <div className="space-y-2">
          {db.ranking.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                Number(r.id) === Number(aluno.id)
                  ? 'border-lime-600/60 bg-lime-900/15'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              <span className="w-8 text-center text-lg font-black text-zinc-400">
                {r.posi_o === 1 ? '🥇' : r.posi_o === 2 ? '🥈' : r.posi_o === 3 ? '🥉' : `${r.posi_o}º`}
              </span>
              <div className="w-40 shrink-0 truncate font-semibold">{r.nome}</div>
              <Chip>{r.avatarn_vel.split(' - ').pop()}</Chip>
              <div className="hidden flex-1 sm:block">
                <Bar pct={(Number(r.xptotal) / maxXP) * 100} className={Number(r.id) === Number(aluno.id) ? 'bg-lime-500' : 'bg-zinc-600'} />
              </div>
              <span className="w-16 text-right font-bold text-lime-300">{r.xptotal} XP</span>
              <span className="hidden w-24 text-right text-xs text-zinc-500 md:block">adesão {Math.round(Number(r.ades_o) * 100)}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Desempate: 1) maior XP total · 2) mais semanas com presença 100% · 3) menor ID de cadastro.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <SectionTitle>Suas semanas com presença 100%</SectionTitle>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => {
              const ok = Number(wp?.[`sem${s}`]) === 1
              return (
                <div
                  key={s}
                  className={`rounded-xl border p-3 text-center ${
                    ok ? 'border-lime-600/60 bg-lime-900/20 text-lime-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                  }`}
                >
                  <div className="text-xs">Sem {s}</div>
                  <div className="mt-1 text-lg">{ok ? '✓' : '·'}</div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            Total: <b className="text-lime-300">{wp?.totalsemanasperfeitas ?? 0} semanas</b> perfeitas no programa.
          </p>
        </div>

        <div className="card">
          <SectionTitle>Como ganhar XP</SectionTitle>
          <table className="data">
            <tbody>
              {db.xpRules.map((r, i) => (
                <tr key={i}>
                  <td>{r.regra}</td>
                  <td className={`w-14 text-right font-bold ${String(r.pontosxp).startsWith('-') ? 'text-red-400' : 'text-lime-300'}`}>
                    {r.pontosxp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <SectionTitle>Conquistas (badges)</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {db.badges.map((b, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm">
                <div className="font-semibold">{b.badge}</div>
                <div className="mt-0.5 text-xs text-zinc-400">{b.crit_rio}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <SectionTitle>Escada de avatares</SectionTitle>
          <div className="space-y-2">
            {db.avatars.map((a) => (
              <div key={a.n_vel} className={`rounded-xl border p-3 text-sm ${a.n_vel === aluno.n_velatual ? 'border-lime-600/60 bg-lime-900/15' : 'border-zinc-800 bg-zinc-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.avatarher_i}</span>
                  <span className="text-xs text-zinc-500">desde {a.xpm_nimo} XP</span>
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">{a.descri_odoavatar}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
