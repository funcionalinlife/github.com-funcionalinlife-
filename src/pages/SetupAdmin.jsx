import { useState } from 'react'
import { db } from '../data.js'
import { PERMISSOES, criarAdmin } from '../usuarios.js'

export default function SetupAdmin({ onConcluido }) {
  const [form, setForm] = useState({ nome: '', login: '', whatsapp: '', senha: '', confirmar: '' })
  const [permissoes, setPermissoes] = useState(PERMISSOES.map(([k]) => k))
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const togglePerm = (k) =>
    setPermissoes(permissoes.includes(k) ? permissoes.filter((p) => p !== k) : [...permissoes, k])

  const concluir = async () => {
    setErro('')
    if (!form.nome.trim() || !form.login.trim()) return setErro('Preencha nome e login.')
    if (!/^\S+@\S+\.\S+$/.test(form.login.trim())) return setErro('O login deve ser um e-mail válido.')
    if (!/^[+\d][\d\s()-]{7,}$/.test(form.whatsapp.trim())) return setErro('Informe um WhatsApp válido (ex.: +55 11 91234-5678).')
    if (form.senha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres.')
    if (form.senha !== form.confirmar) return setErro('As senhas não conferem.')
    if (!permissoes.length) return setErro('Selecione ao menos uma permissão.')
    const r = await criarAdmin({ ...form, permissoes })
    if (!r.ok) return setErro(r.erro)
    setOk(true)
    setTimeout(() => onConcluido({ login: r.usuario.login, nome: r.usuario.nome, papel: 'admin', permissoes: r.usuario.permissoes }), 900)
  }

  const field = 'mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-lime-500/70'
  const label = 'mt-4 block text-sm font-semibold text-zinc-300'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-lime-950/40 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-500 text-3xl">💪</div>
          <h1 className="text-3xl font-black tracking-tight">Primeiro acesso</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Crie a conta de <b className="text-lime-300">administrador</b> do {db.programMeta.titulo || 'portal'}.
            Ela gerencia professores, alunos e permissões.
          </p>
        </div>

        <div className="card">
          <label className={label}>Nome completo</label>
          <input className={field} placeholder="Ex.: Seu Nome" value={form.nome} onChange={set('nome')} />
          <label className={label}>Login (e-mail)</label>
          <input className={field} placeholder="admin@seudominio.com" value={form.login} onChange={set('login')} />
          <label className={label}>WhatsApp</label>
          <input className={field} placeholder="+55 11 91234-5678" value={form.whatsapp} onChange={set('whatsapp')} />
          <label className={label}>Senha</label>
          <input type="password" className={field} placeholder="mínimo 6 caracteres" value={form.senha} onChange={set('senha')} />
          <label className={label}>Confirmar senha</label>
          <input type="password" className={field} placeholder="repita a senha" value={form.confirmar} onChange={set('confirmar')} />

          <div className="mt-5 text-sm font-semibold text-zinc-300">Permissões do administrador</div>
          <div className="mt-2 space-y-2">
            {PERMISSOES.map(([k, desc]) => (
              <label key={k} className="flex cursor-pointer items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm">
                <input type="checkbox" className="mt-0.5 accent-lime-500" checked={permissoes.includes(k)} onChange={() => togglePerm(k)} />
                <span><b className="text-zinc-200">{k === 'gerenciar_usuarios' ? 'Gerenciar usuários' : k === 'instrutor' ? 'Área do instrutor' : 'Exportar CSV/PDF'}</b><br /><span className="text-xs text-zinc-500">{desc}</span></span>
              </label>
            ))}
          </div>

          {erro && <p className="mt-3 rounded-lg border border-red-800/60 bg-red-900/20 px-3 py-2 text-xs text-red-300">{erro}</p>}
          {ok && <p className="mt-3 rounded-lg border border-lime-800/60 bg-lime-900/20 px-3 py-2 text-xs text-lime-300">✅ Administrador criado! Entrando…</p>}
          <button className="btn-primary mt-5 w-full" onClick={concluir} disabled={ok}>
            Criar conta de administrador
          </button>
          <p className="mt-3 text-xs text-zinc-500">
            Contas de professor e alunos são criadas depois, na área de usuários ou no próprio login
            (cadastro com aprovação do administrador).
          </p>
        </div>
      </div>
    </div>
  )
}
