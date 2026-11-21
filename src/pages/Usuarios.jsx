import { useState } from 'react'
import { Chip, SectionTitle } from '../ui.jsx'
import { alunosGeridos, salvarAlunosGeridos, demoAtivo, alternarDemo, novoAlunoGerido, db } from '../data.js'
import {
  getUsuarios, aprovarUsuario, definirPapel, definirSenha, removerUsuario, criarProfessor,
  sbCfg, supabaseAtivo, salvarSbCfg, sbTeste, setSessao, sessaoAluno,
} from '../usuarios.js'
import { sha256hex } from '../auth.js'

export function AlunosPrograma({ podeDemo = true }) {
  const [versao, setVersao] = useState(0)
  const atualizar = () => setVersao((v) => v + 1)
  const usuarios = getUsuarios()
  const geridos = alunosGeridos()
  const [novo, setNovo] = useState({ nome: '', email: '', whatsapp: '', objetivo: '', senha: '', turno: '' })
  const [novoErro, setNovoErro] = useState('')
  const [novoOk, setNovoOk] = useState('')

  const cadastrarAlunoApp = async () => {
    setNovoErro(''); setNovoOk('')
    const email = String(novo.email || '').trim().toLowerCase()
    if (!novo.nome.trim() || !email) return setNovoErro('Nome e e-mail são obrigatórios.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setNovoErro('Informe um e-mail válido.')
    if (novo.senha.length < 4) return setNovoErro('A senha inicial deve ter no mínimo 4 caracteres.')
    if (usuarios.some((u) => u.login === email) || geridos.some((a) => a.email === email)
      || db.students.some((s) => String(s.email).trim().toLowerCase() === email))
      return setNovoErro('Já existe aluno/conta com este e-mail.')
    const aluno = novoAlunoGerido({ nome: novo.nome.trim(), email, whatsapp: novo.whatsapp, objetivo: novo.objetivo, turno: novo.turno })
    salvarAlunosGeridos([...geridos, { ...aluno, telefone: novo.whatsapp || '' }])
    const hash = await sha256hex(novo.senha)
    localStorage.setItem(
      'portal_usuarios',
      JSON.stringify([
        { login: email, nome: aluno.nomecompleto, whatsapp: novo.whatsapp || '', papel: 'aluno', status: 'ativo',
          permissoes: [], aluno_id: aluno.id, criado_em: new Date().toISOString(), senha_hash: hash },
        ...getUsuarios(),
      ])
    )
    setNovo({ nome: '', email: '', whatsapp: '', objetivo: '', senha: '', turno: '' })
    setNovoOk(`✅ ${aluno.nomecompleto} cadastrado! Login: ${email} + a senha inicial definida.`)
    atualizar()
  }

  const removerAlunoApp = (aluno) => {
    if (!window.confirm(`Remover ${aluno.nomecompleto} e sua conta?`)) return
    salvarAlunosGeridos(geridos.filter((a) => a.id !== aluno.id))
    localStorage.setItem(
      'portal_usuarios',
      JSON.stringify(getUsuarios().filter((u) => u.login !== aluno.email))
    )
    atualizar()
  }

  const entrarComo = (aluno) => {
    const s = sessaoAluno(aluno)
    setSessao(s)
    localStorage.setItem('portal_user_id', String(aluno.id))
    window.location.hash = '#/home'
    window.location.reload()
  }

  const field = 'rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-lime-500/70'

  return (
    <div className="card">
      <SectionTitle right={podeDemo && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" className="accent-lime-500" checked={demoAtivo()} onChange={() => { alternarDemo(); atualizar() }} />
          Dados de exemplo (modelo original da planilha)
        </label>
      )}>
        Alunos do programa
      </SectionTitle>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="text-sm font-semibold text-zinc-200">Cadastrar novo aluno</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={field} placeholder="Nome completo *" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <input className={field} placeholder="E-mail *" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          <input className={field} placeholder="WhatsApp" value={novo.whatsapp} onChange={(e) => setNovo({ ...novo, whatsapp: e.target.value })} />
          <input className={field} placeholder="Objetivo (ex.: Treino de força)" value={novo.objetivo} onChange={(e) => setNovo({ ...novo, objetivo: e.target.value })} />
          <input className={field} placeholder="Turno (Matutino/Vespertino/Noturno)" value={novo.turno} onChange={(e) => setNovo({ ...novo, turno: e.target.value })} />
          <input type="password" className={field} placeholder="Senha inicial (mín. 4) *" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={cadastrarAlunoApp}>＋ Cadastrar aluno</button>
          {novoErro && <span className="text-xs text-red-300">{novoErro}</span>}
          {novoOk && <span className="text-xs text-lime-300">{novoOk}</span>}
        </div>
      </div>

      <table className="data mt-4 min-w-[720px]">
        <thead>
          <tr><th>Aluno</th><th>E-mail</th><th>WhatsApp</th><th>Objetivo</th><th>Turno</th><th>Cadastro</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {geridos.length === 0 && (
            <tr><td colSpan="7" className="py-5 text-center text-sm text-zinc-400">Nenhum aluno cadastrado pelo app ainda.</td></tr>
          )}
          {geridos.map((a) => (
            <tr key={`${versao}-${a.id}`}>
              <td className="whitespace-nowrap font-medium">{a.nomecompleto}</td>
              <td className="text-xs text-zinc-400">{a.email}</td>
              <td className="text-xs text-zinc-400">{a.telefone || '—'}</td>
              <td className="max-w-36 truncate text-xs text-zinc-400">{a.objetivoprincipal}</td>
              <td className="text-xs text-zinc-400">{a.turnopreferido}</td>
              <td className="text-xs text-zinc-500">{a.datadecadastro}</td>
              <td className="whitespace-nowrap">
                <div className="flex gap-1">
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => entrarComo(a)} title="Entra no portal como este aluno (substitui a sessão atual)">👁️ Entrar como</button>
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => removerAlunoApp(a)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-zinc-500">
        O aluno cadastrado já pode entrar no portal com o e-mail + senha inicial definidos (aba 🎓 Aluno),
        e trocar a senha pelo 🔑 no topo. O programa de treino (8 semanas × 4 fases) vale para todos,
        pois está embutido como modelo do app. "Entrar como" sai da sessão atual para visualizar o
        portal pelo olhar do aluno.
      </p>
    </div>
  )
}

function PainelCredenciais() {
  const [versao, setVersao] = useState(0)
  const atualizar = () => setVersao((v) => v + 1)
  const usuarios = getUsuarios()
  const [prof, setProf] = useState({ nome: '', login: '', whatsapp: '', senha: '' })
  const [profErro, setProfErro] = useState('')
  const [profOk, setProfOk] = useState('')

  const cadastrarProfessorApp = async () => {
    setProfErro(''); setProfOk('')
    const r = await criarProfessor({
      nome: prof.nome.trim(),
      login: prof.login,
      whatsapp: prof.whatsapp.trim(),
      senha: prof.senha,
    })
    if (!r.ok) return setProfErro(r.erro)
    setProf({ nome: '', login: '', whatsapp: '', senha: '' })
    setProfOk(`✅ Professor ${r.usuario.nome} cadastrado! Login: ${r.usuario.login} (entrar pela aba 🧑‍🏫 Equipe).`)
    atualizar()
  }

  const field = 'rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-lime-500/70'

  return (
    <div className="card">
      <SectionTitle>Gerenciamento de usuários e credenciais</SectionTitle>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="text-sm font-semibold text-zinc-200">Cadastrar professor</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className={field} placeholder="Nome completo *" value={prof.nome} onChange={(e) => setProf({ ...prof, nome: e.target.value })} />
          <input className={field} placeholder="Login (e-mail) *" value={prof.login} onChange={(e) => setProf({ ...prof, login: e.target.value })} />
          <input className={field} placeholder="WhatsApp" value={prof.whatsapp} onChange={(e) => setProf({ ...prof, whatsapp: e.target.value })} />
          <input type="password" className={field} placeholder="Senha (mín. 4) *" value={prof.senha} onChange={(e) => setProf({ ...prof, senha: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && cadastrarProfessorApp()} />
          <button className="btn-primary" onClick={cadastrarProfessorApp}>＋ Cadastrar professor</button>
        </div>
        {(profErro || profOk) && (
          <p className={`mt-2 text-xs ${profErro ? 'text-red-300' : 'text-lime-300'}`}>{profErro || profOk}</p>
        )}
      </div>

      <table className="data mt-4 min-w-[820px]">
        <thead>
          <tr><th>Nome</th><th>Login (e-mail)</th><th>WhatsApp</th><th>Papel</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const vinculo = db.students.find((a) => Number(a.id) === Number(u.aluno_id))
            return (
              <tr key={`${versao}-${u.login}`}>
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
        Cadastros feitos no próprio portal (aba ✨ Cadastrar) entram como <b>Pendente</b> até a aprovação aqui.
        Alunos de exemplo usam a senha padrão <code className="rounded bg-zinc-800 px-1">studio&lt;nº&gt;</code>.
      </p>
    </div>
  )
}

function PainelSupabase() {
  const cfg = sbCfg() || { url: '', key: '' }
  const [sb, setSb] = useState({ url: cfg.url, key: cfg.key })
  const [sbStatus, setSbStatus] = useState(supabaseAtivo() ? 'Colado — recuperação via Supabase ativa' : '')

  const salvarSupabase = async () => {
    if (!sb.url || !sb.key) return setSbStatus('Preencha URL e anon key.')
    salvarSbCfg(sb.url, sb.key)
    const t = await sbTeste({ url: sb.url, key: sb.key })
    setSbStatus(t.ok ? '✅ Conectado — e-mails de recuperação via Supabase' : `❌ ${t.detalhe}`)
  }

  return (
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
  )
}

export default function Usuarios() {
  return (
    <div className="space-y-6">
      <PainelCredenciais />
      <AlunosPrograma />
      <PainelSupabase />
    </div>
  )
}
