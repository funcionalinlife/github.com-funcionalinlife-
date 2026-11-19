import { useState } from 'react'
import { db } from './data.js'

export default function Login({ onEnter }) {
  const [selecionado, setSelecionado] = useState(null)
  const alunos = db.students

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-lime-950/40 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-500 text-3xl">💪</div>
          <h1 className="text-3xl font-black tracking-tight">Portal do Aluno</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {db.programMeta.titulo} — {db.programMeta.linha1}
          </p>
        </div>

        <div className="card">
          <label className="text-sm font-semibold text-zinc-300">Entre com o e-mail cadastrado</label>
          <input
            list="alunos-emails"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-lime-500/70"
            placeholder="seu.email@email.com"
            value={selecionado ?? ''}
            onChange={(e) => setSelecionado(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onEnter(selecionado)}
          />
          <datalist id="alunos-emails">
            {alunos.map((a) => (
              <option key={a.id} value={a.email} />
            ))}
          </datalist>
          <button className="btn-primary mt-4 w-full" onClick={() => onEnter(selecionado)}>
            Entrar no portal
          </button>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Demonstração: use um dos e-mails cadastrados (basta clicar em um aluno abaixo). Nenhuma senha é
            verificada nesta versão — a autenticação real será ligada ao cadastro do studio.
          </p>
        </div>

        <div className="mt-6 card">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Alunos cadastrados</div>
          <ul className="mt-2 divide-y divide-zinc-800 text-sm">
            {alunos.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <button className="text-left hover:text-lime-300" onClick={() => setSelecionado(a.email)}>
                  <span className="font-medium">{a.nomecompleto}</span>
                  <span className="ml-2 text-xs text-zinc-500">{a.email}</span>
                </button>
                <span className="chip">{a.n_velatual}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
