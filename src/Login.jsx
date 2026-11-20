import { useState } from 'react'
import { db } from './data.js'
import { verifyLogin } from './auth.js'

export default function Login({ onEnter }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const alunos = db.students

  const entrar = async () => {
    setErro('')
    const aluno = alunos.find((a) => a.email.trim().toLowerCase() === (email || '').trim().toLowerCase())
    if (!aluno) {
      setErro('E-mail não encontrado no cadastro do studio.')
      return
    }
    const ok = await verifyLogin(senha, aluno.senha_hash, aluno.id)
    if (!ok) {
      setErro('Senha incorreta. Tente novamente.')
      return
    }
    onEnter(aluno)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-lime-950/40 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-500 text-3xl">💪</div>
          <h1 className="text-3xl font-black tracking-tight">Portal do Aluno</h1>
          <p className="mt-2 text-sm text-zinc-400">{db.programMeta.titulo}</p>
        </div>

        <div className="card">
          <label className="text-sm font-semibold text-zinc-300">E-mail cadastrado</label>
          <input
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-lime-500/70"
            placeholder="seu.email@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />
          <label className="mt-4 block text-sm font-semibold text-zinc-300">Senha</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-lime-500/70"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />
          {erro && <p className="mt-3 rounded-lg border border-red-800/60 bg-red-900/20 px-3 py-2 text-xs text-red-300">{erro}</p>}
          <button className="btn-primary mt-4 w-full" onClick={entrar}>
            Entrar no portal
          </button>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Senha inicial fornecida pela recepção do studio (padrão de demonstração:
            <code className="mx-1 rounded bg-zinc-800 px-1">studio&lt;nº do aluno&gt;</code> — ex.:
            <code className="mx-1 rounded bg-zinc-800 px-1">studio1</code> para Ana Beatriz).
            Você pode alterá-la a qualquer momento após entrar.
          </p>
        </div>

        <div className="mt-6 card">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Alunos cadastrados</div>
          <ul className="mt-2 divide-y divide-zinc-800 text-sm">
            {alunos.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <button
                  className="text-left hover:text-lime-300"
                  onClick={() => {
                    setEmail(a.email)
                    setErro('')
                  }}
                >
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
