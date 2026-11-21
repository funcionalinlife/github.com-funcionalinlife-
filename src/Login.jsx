import { useState } from 'react'
import { db, todosAlunos } from './data.js'
import { verifyLogin } from './auth.js'
import { getUsuarios, setSessao, sessaoAluno, entrarEquipe, cadastrarAluno, iniciarRecuperacao, concluirRecuperacao, supabaseAtivo, verificarSenhaAlunoGerido } from './usuarios.js'

const MODOS = [
  ['aluno', '🎓 Aluno'],
  ['equipe', '🧑‍🏫 Equipe'],
  ['cadastro', '✨ Cadastrar'],
  ['recuperar', '🔑 Recuperar'],
]

export default function Login({ onEnter, onEquipe }) {
  const [modo, setModo] = useState('aluno')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', senha: '', confirmar: '', codigo: '' })
  const [reset, setReset] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const alunos = todosAlunos()

  const limpar = () => { setErro(''); setAviso('') }

  const entrarAluno = async () => {
    limpar()
    const email = String(form.email || '').trim().toLowerCase()
    const aluno = alunos.find((a) => String(a.email).trim().toLowerCase() === email)
    if (!aluno) {
      const pendente = getUsuarios().find((x) => x.login === email && x.status !== 'ativo')
      return setErro(
        pendente
          ? 'Seu cadastro está Pendente — aguardando aprovação do administrador do studio.'
          : 'E-mail não encontrado. Faça o cadastro ou contate a recepção.'
      )
    }
    const ok = aluno.exemplo
      ? await verifyLogin(form.senha, aluno.senha_hash, aluno.id)
      : await verificarSenhaAlunoGerido(aluno, form.senha)
    if (!ok) return setErro('Senha incorreta. Tente novamente ou use a recuperação.')
    setSessao(sessaoAluno(aluno))
    onEnter(aluno)
  }

  const entrarEquipeOk = async () => {
    limpar()
    const r = await entrarEquipe(form.email, form.senha)
    if (!r.ok) return setErro(r.erro)
    onEquipe(r.sessao)
  }

  const enviarCadastro = async () => {
    limpar()
    if (form.senha !== form.confirmar) return setErro('As senhas não conferem.')
    const email = String(form.email || '').trim().toLowerCase()
    const alunoVinculado = alunos.find((a) => String(a.email).trim().toLowerCase() === email)
    if (supabaseAtivo()) {
      const { sbCfg, sbSignup } = await import('./usuarios.js')
      await sbSignup(sbCfg(), email, form.senha)
    }
    const r = await cadastrarAluno({ nome: form.nome, email, senha: form.senha, whatsapp: form.whatsapp }, alunoVinculado)
    if (!r.ok) return setErro(r.erro)
    if (r.vinculado) {
      setAviso('✅ Cadastro criado! Agora faça login em Aluno com sua senha.')
      setModo('aluno')
    } else {
      setAviso('Cadastro recebido! Ele está PENDENTE — o administrador precisa aprová-lo na área de usuários antes do primeiro acesso.')
    }
  }

  const pedirRecuperacao = async () => {
    limpar()
    const r = await iniciarRecuperacao(form.email)
    if (!r.ok) return setErro(r.erro)
    if (r.modo === 'supabase') {
      setAviso('E-mail de recuperação enviado! Abra o link recebido no seu e-mail para definir a nova senha.')
    } else {
      setReset(r.codigo)
      setAviso(`Modo local (sem e-mail real): seu código de recuperação é ${r.codigo}. Informe-o abaixo junto com a nova senha. Válido por 15 minutos.`)
    }
  }

  const trocarSenhaFinal = async () => {
    limpar()
    const r = await concluirRecuperacao(form.email, form.codigo, form.senha)
    if (!r.ok) return setErro(r.erro)
    setReset(null)
    setAviso('✅ Senha redefinida com sucesso! Faça login com a nova senha.')
    setModo('aluno')
  }

  const field = 'mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-lime-500/70'
  const label = 'mt-4 block text-sm font-semibold text-zinc-300'
  const enter = (fn) => (e) => e.key === 'Enter' && fn()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-lime-950/40 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-500 text-3xl">💪</div>
          <h1 className="text-3xl font-black tracking-tight">Portal do Aluno</h1>
          <p className="mt-2 text-sm text-zinc-400">{db.programMeta.titulo}</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {MODOS.map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => { setModo(k); limpar(); setReset(null); setAviso('') }}
              className={`chip transition ${modo === k ? 'border-lime-600 bg-lime-900/40 text-lime-200' : 'text-zinc-400'}`}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="card">
          {modo === 'equipe' && (
            <>
              <label className="text-sm font-semibold text-zinc-300">Login (e-mail do administrador ou professor)</label>
              <input className={field} placeholder="admin@seudominio.com" value={form.email} onChange={set('email')} onKeyDown={enter(entrarEquipeOk)} />
              <label className={label}>Senha</label>
              <input type="password" className={field} placeholder="••••••••" value={form.senha} onChange={set('senha')} onKeyDown={enter(entrarEquipeOk)} />
              <button className="btn-primary mt-4 w-full" onClick={entrarEquipeOk}>Entrar como equipe</button>
            </>
          )}

          {modo === 'aluno' && (
            <>
              <label className="text-sm font-semibold text-zinc-300">E-mail cadastrado</label>
              <input className={field} placeholder="seu.email@email.com" value={form.email} onChange={set('email')} onKeyDown={enter(entrarAluno)} />
              <label className={label}>Senha</label>
              <input type="password" className={field} placeholder="••••••••" value={form.senha} onChange={set('senha')} onKeyDown={enter(entrarAluno)} />
              <button className="btn-primary mt-4 w-full" onClick={entrarAluno}>Entrar no portal</button>
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                Alunos de exemplo (modelo da planilha): senha <code className="rounded bg-zinc-800 px-1">studio&lt;nº&gt;</code>.
                Alunos cadastrados pelo admin: usam a senha inicial definida por ele — altere pelo 🔑 ou via recuperação.
              </p>
            </>
          )}

          {modo === 'cadastro' && (
            <>
              <p className="text-xs text-zinc-500">Cadastre-se com e-mail, WhatsApp e senha. Se o e-mail não estiver na planilha do studio, a conta fica pendente de aprovação do administrador.</p>
              <label className={label}>Nome completo</label>
              <input className={field} value={form.nome} onChange={set('nome')} />
              <label className={label}>E-mail</label>
              <input className={field} placeholder="seu.email@email.com" value={form.email} onChange={set('email')} />
              <label className={label}>WhatsApp</label>
              <input className={field} placeholder="+55 11 91234-5678" value={form.whatsapp} onChange={set('whatsapp')} />
              <label className={label}>Senha (mínimo 4 caracteres)</label>
              <input type="password" className={field} value={form.senha} onChange={set('senha')} />
              <label className={label}>Confirmar senha</label>
              <input type="password" className={field} value={form.confirmar} onChange={set('confirmar')} onKeyDown={enter(enviarCadastro)} />
              <button className="btn-primary mt-4 w-full" onClick={enviarCadastro}>Criar minha conta</button>
            </>
          )}

          {modo === 'recuperar' && (
            <>
              <p className="text-xs text-zinc-500">
                {supabaseAtivo()
                  ? 'Você receberá um e-mail com link para redefinir a senha.'
                  : 'Modo local (site estático): o código de recuperação aparece na tela — com o Supabase configurado ele chega por e-mail.'}
              </p>
              <label className={label}>E-mail da conta</label>
              <input className={field} value={form.email} onChange={set('email')} />
              {reset && (
                <>
                  <label className={label}>Código de recuperação</label>
                  <input className={field} value={form.codigo} onChange={set('codigo')} />
                  <label className={label}>Nova senha</label>
                  <input type="password" className={field} value={form.senha} onChange={set('senha')} onKeyDown={enter(trocarSenhaFinal)} />
                </>
              )}
              <button className="btn-primary mt-4 w-full" onClick={reset ? trocarSenhaFinal : pedirRecuperacao}>
                {reset ? 'Redefinir senha' : 'Gerar código / enviar e-mail'}
              </button>
            </>
          )}

          {erro && <p className="mt-3 rounded-lg border border-red-800/60 bg-red-900/20 px-3 py-2 text-xs text-red-300">{erro}</p>}
          {aviso && <p className="mt-3 rounded-lg border border-lime-800/60 bg-lime-900/20 px-3 py-2 text-xs text-lime-300">{aviso}</p>}
        </div>

        {modo === 'aluno' && (
          <div className="mt-6 card">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Alunos do programa</div>
            <ul className="mt-2 divide-y divide-zinc-800 text-sm">
              {alunos.map((a) => (
                <li key={`${a.exemplo ? 'ex' : 'al'}-${a.id}`} className="flex items-center justify-between py-2">
                  <button
                    className="text-left hover:text-lime-300"
                    onClick={() => { setForm({ ...form, email: a.email }); limpar() }}
                  >
                    <span className="font-medium">{a.nomecompleto}</span>
                    <span className="ml-2 text-xs text-zinc-500">{a.email}</span>
                  </button>
                  <span className={`chip ${a.exemplo ? 'opacity-60' : ''}`}>{a.exemplo ? 'Exemplo' : a.n_velatual}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
