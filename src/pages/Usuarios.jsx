import { useState } from 'react'
import { Chip, SectionTitle } from '../ui.jsx'
import { db } from '../data.js'
import {
  getUsuarios, aprovarUsuario, definirPapel, definirSenha, removerUsuario,
  sbCfg, supabaseAtivo, salvarSbCfg, sbTeste,
} from '../usuarios.js'

const PAPEL_TONE = { admin: 'red', professor: 'yellow', aluno: 'green' }

export default function Usuarios() {
  const [versao, setVersao] = useState(0)
  const atualizar = () => setVersao((v) => v + 1)
  const usuarios = getUsuarios()

  const cfg = sbCfg() || { url: '', key: '' }
  const [sb, setSb] = useState({ url: cfg.url, key: cfg.key })
  const [sbStatus, setSbStatus] = useState(supabaseAtivo() ? 'Colado — recuperação via Supabase ativa' : '')

  const salvarSupabase = async () => {
    if (!sb.url || !sb.key) return setSbStatus('Preencha URL e anon key.')
    salvarSbCfg(sb.url, sb.key)
    const t = await sbTeste({ url: sb.url, key: sb.key })
    setSbStatus(t.ok ? '✅ Conectado — e-mails de recuperação via Supabase' : `❌ ${t.detalhe}`)
  }

  const detalhesAluno = (u) => db.students.find((a) => Number(a.id) === Number(u.aluno_id))

  return (
    <div className="space-y-6">
      <div className="card">
        <SectionTitle>Gerenciamento de usuários e credenciais</SectionTitle>
        <table className="data min-w-[820px]">
          <thead>
            <tr><th>Nome</th><th>Login (e-mail)</th><th>WhatsApp</th><th>Papel</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr><td colSpan="6" className="py-6 text-center text-sm text-zinc-400">Nenhuma conta cadastrada ainda.</td></tr>
            )}
            {usuarios.map((u) => {
              const vinculo = detalhesAluno(u)
              return (
                <tr key={u.login}>
                  <td className="whitespace-nowrap font-medium">
                    {u.nome}
                    {vinculo && <div className="text-xs text-zinc-500">aluno #{u.aluno_id}</div>}
                  </td>
                  <td className="whitespace-nowrap text-xs text-zinc-400">{u.login}</td>
                  <td className="whitespace-nowrap text-xs text-zinc-400">{u.whatsapp || '—'}</td>
                  <td>
                    <select
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs"
                      value={u.papel}
                      onChange={async (e) => { await definirPapel(u.login, e.target.value); atualizar() }}
                    >
                      <option value="admin">Administrador</option>
                      <option value="professor">Professor</option>
                      <option value="aluno">Aluno</option>
                    </select>
                  </td>
                  <td>
                    <Chip tone={u.status === 'ativo' ? 'green' : 'yellow'}>
                      {u.status === 'ativo' ? 'Ativo' : 'Pendente'}
                    </Chip>
                    {!vinculo && u.papel === 'aluno' && (
                      <div className="mt-1 text-xs text-yellow-300/80">sem vínculo na planilha</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {u.status !== 'ativo' && (
                        <button className="btn-ghost px-2 py-1 text-xs" onClick={async () => { await aprovarUsuario(u.login); atualizar() }}>✅ Aprovar</button>
                      )}
                      <button
                        className="btn-ghost px-2 py-1 text-xs"
                        onClick={async () => {
                          const nova = prompt(`Nova senha para ${u.nome}:`)
                          if (nova === null) return
                          const r = await definirSenha(u.login, nova)
                          alert(r.ok ? 'Senha redefinida.' : r.erro)
                        }}
                      >🔑 Senha</button>
                      <button
                        className="btn-ghost px-2 py-1 text-xs"
                        onClick={async () => {
                          if (!window.confirm(`Remover conta de ${u.nome}?`)) return
                          await removerUsuario(u.login)
                          atualizar()
                        }}
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-zinc-500">
          Cadastros de alunos feitos no próprio portal entram como <b>Pendente</b> e só conseguem entrar após a aprovação
          aqui. Alunos já presentes na planilha entram com a senha padrão <code className="rounded bg-zinc-800 px-1">studio&lt;nº&gt;</code>.
        </p>
      </div>

      <div className="card">
        <SectionTitle>Recuperação de senha por e-mail (Supabase)</SectionTitle>
        <p className="text-sm text-zinc-400">
          Sem backend, a recuperação funciona em modo demonstração (o código aparece na própria tela).
          Cole abaixo as credenciais de um projeto gratuito em <b className="text-lime-300">supabase.com</b>
          {' '}(Settings → API) para enviar e-mails de recuperação de verdade.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Project URL</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-lime-500/70"
              placeholder="https://xxxx.supabase.co"
              value={sb.url}
              onChange={(e) => setSb({ ...sb, url: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Anon public key</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-lime-500/70"
              placeholder="eyJhbGciOi…"
              value={sb.key}
              onChange={(e) => setSb({ ...sb, key: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button className="btn-primary" onClick={salvarSupabase}>Salvar e testar</button>
          {sbStatus && <span className={`text-xs ${sbStatus.startsWith('✅') ? 'text-lime-300' : sbStatus.startsWith('❌') ? 'text-red-300' : 'text-zinc-400'}`}>{sbStatus}</span>}
        </div>
      </div>
    </div>
  )
}
