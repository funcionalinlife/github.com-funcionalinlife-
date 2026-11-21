import { sha256hex, changePassword } from './auth.js'
import { todosAlunos } from './data.js'

const KEY = 'portal_usuarios'
const SESSAO_KEY = 'portal_sessao'
const SB_KEY = 'portal_supabase_cfg'
const resetKey = (login) => `portal_reset_${login}`

export const PERMISSOES = [
  ['gerenciar_usuarios', 'Gerenciar usuários e credenciais'],
  ['instrutor', 'Área do instrutor (painel, alertas, cronômetro)'],
  ['exportar', 'Exportação CSV/PDF'],
]

export const getUsuarios = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
const putUsuarios = (lista) => localStorage.setItem(KEY, JSON.stringify(lista))

export const temAdmin = () =>
  getUsuarios().some((u) => u.papel === 'admin' && u.status === 'ativo')

export const getSessao = () => {
  try { return JSON.parse(localStorage.getItem(SESSAO_KEY) || 'null') } catch { return null }
}
export const setSessao = (s) => localStorage.setItem(SESSAO_KEY, JSON.stringify(s))
export const clearSessao = () => localStorage.removeItem(SESSAO_KEY)

export const sessaoAluno = (aluno) => ({
  login: String(aluno.email || '').trim().toLowerCase(),
  nome: aluno.nomecompleto,
  papel: 'aluno',
  aluno_id: aluno.id,
  permissoes: [],
})

const registro = (login) =>
  getUsuarios().find((u) => String(u.login).toLowerCase() === String(login || '').trim().toLowerCase())

async function novoUsuario({ login, nome, whatsapp, senha, papel, status, permissoes, aluno_id }) {
  const u = {
    login: String(login).trim().toLowerCase(),
    nome: nome || login,
    whatsapp: whatsapp || '',
    papel,
    status,
    permissoes,
    aluno_id: aluno_id ?? null,
    criado_em: new Date().toISOString(),
    senha_hash: await sha256hex(senha),
  }
  const lista = getUsuarios().filter((x) => x.login !== u.login)
  putUsuarios([u, ...lista])
  return u
}

export async function criarAdmin({ login, senha, nome, whatsapp, permissoes }) {
  if (!login || !senha) return { ok: false, erro: 'Login e senha são obrigatórios.' }
  if (senha.length < 4) return { ok: false, erro: 'A senha deve ter no mínimo 4 caracteres.' }
  if (getUsuarios().some((x) => x.papel === 'admin')) return { ok: false, erro: 'O administrador já foi criado.' }
  const u = await novoUsuario({ login, senha, nome, whatsapp, papel: 'admin', status: 'ativo', permissoes })
  return { ok: true, usuario: u }
}

export async function entrarEquipe(login, senha) {
  const u = registro(login)
  if (!u || (u.papel !== 'admin' && u.papel !== 'professor'))
    return { ok: false, erro: 'Conta da equipe não encontrada.' }
  if (u.status !== 'ativo')
    return { ok: false, erro: 'Conta aguardando ativação pelo administrador.' }
  if ((await sha256hex(senha)) !== u.senha_hash)
    return { ok: false, erro: 'Senha incorreta.' }
  const sessao = { login: u.login, nome: u.nome, papel: u.papel, permissoes: u.permissoes || [] }
  setSessao(sessao)
  return { ok: true, sessao }
}

export async function cadastrarAluno({ nome, email, senha, whatsapp }, alunoVinculado) {
  if (!email || !senha || !nome) return { ok: false, erro: 'Nome, e-mail e senha são obrigatórios.' }
  if (senha.length < 4) return { ok: false, erro: 'A senha deve ter no mínimo 4 caracteres.' }
  const login = String(email).trim().toLowerCase()
  if (getUsuarios().some((x) => x.login === login))
    return { ok: false, erro: 'Já existe uma conta com este e-mail.' }
  const u = await novoUsuario({
    login, senha, nome, whatsapp,
    papel: 'aluno',
    status: alunoVinculado ? 'ativo' : 'pendente',
    permissoes: [],
    aluno_id: alunoVinculado ? alunoVinculado.id : null,
  })
  return { ok: true, vinculado: !!alunoVinculado, usuario: u }
}

export async function aprovarUsuario(login) {
  const vinculo = todosAlunos().find((a) => String(a.email).trim().toLowerCase() === String(login).toLowerCase())
  putUsuarios(
    getUsuarios().map((u) =>
      u.login === login
        ? { ...u, status: 'ativo', aluno_id: u.aluno_id ?? (vinculo ? vinculo.id : null) }
        : u
    )
  )
}

export async function verificarSenhaAlunoGerido(aluno, senha) {
  const override = localStorage.getItem(`portal_senha_${aluno.id}`)
  const u = registro(aluno.email)
  const alvo = override || (u && u.senha_hash)
  if (!alvo) return false
  return (await sha256hex(senha)) === alvo
}

export async function definirPapel(login, papel) {
  putUsuarios(getUsuarios().map((u) => (u.login === login ? { ...u, papel } : u)))
}

export async function definirSenha(login, nova) {
  if (!nova || nova.length < 4) return { ok: false, erro: 'A senha deve ter no mínimo 4 caracteres.' }
  const hash = await sha256hex(nova)
  putUsuarios(getUsuarios().map((u) => (u.login === login ? { ...u, senha_hash: hash } : u)))
  return { ok: true }
}

export async function removerUsuario(login) {
  putUsuarios(getUsuarios().filter((u) => u.login !== login))
}

export async function trocarSenhaPropria(sessao, nova, confirmacao) {
  if (nova !== confirmacao) return { ok: false, erro: 'As senhas não conferem.' }
  return definirSenha(sessao.login, nova)
}

// ----- recuperação híbrida (local ou Supabase) -----

export const sbCfg = () => {
  try { return JSON.parse(localStorage.getItem(SB_KEY) || 'null') } catch { return null }
}
export const supabaseAtivo = () => {
  const c = sbCfg()
  return !!(c && c.url && c.key)
}
export const salvarSbCfg = (url, key) =>
  localStorage.setItem(SB_KEY, JSON.stringify({ url: String(url).trim().replace(/\/+$/, ''), key: String(key).trim() }))

const sbHeaders = (c) => ({
  apikey: c.key,
  Authorization: `Bearer ${c.key}`,
  'Content-Type': 'application/json',
})

export async function sbTeste(cfg) {
  try {
    const r = await fetch(`${cfg.url}/auth/v1/health`, { headers: sbHeaders(cfg) })
    return { ok: r.ok, detalhe: r.ok ? 'Conexão OK' : `HTTP ${r.status}` }
  } catch (e) {
    return { ok: false, detalhe: String(e) }
  }
}

export async function sbSignup(cfg, email, senha) {
  try {
    const r = await fetch(`${cfg.url}/auth/v1/signup`, {
      method: 'POST', headers: sbHeaders(cfg), body: JSON.stringify({ email, password: senha }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, erro: j.msg || j.error_description || j.message || `HTTP ${r.status}` }
    return { ok: true, confirmacaoEmail: !j.access_token }
  } catch (e) {
    return { ok: false, erro: String(e) }
  }
}

export async function sbSignin(cfg, email, senha) {
  try {
    const r = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: sbHeaders(cfg), body: JSON.stringify({ email, password: senha }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, erro: j.error_description || j.msg || `HTTP ${r.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: String(e) }
  }
}

export async function sbRecover(cfg, email) {
  try {
    const r = await fetch(`${cfg.url}/auth/v1/recover`, {
      method: 'POST', headers: sbHeaders(cfg), body: JSON.stringify({ email }),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      return { ok: false, erro: j.error_description || j.msg || `HTTP ${r.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: String(e) }
  }
}

export async function iniciarRecuperacao(email) {
  const u = registro(email)
  if (!u) return { ok: false, erro: 'Nenhuma conta cadastrada com este e-mail.' }
  if (supabaseAtivo()) {
    const r = await sbRecover(sbCfg(), u.login)
    return r.ok ? { ok: true, modo: 'supabase' } : { ok: false, erro: r.erro }
  }
  const codigo = String(Math.floor(100000 + Math.random() * 900000))
  localStorage.setItem(resetKey(u.login), JSON.stringify({ codigo, expira: Date.now() + 15 * 60000 }))
  return { ok: true, modo: 'local', codigo }
}

export async function concluirRecuperacao(email, codigo, novaSenha) {
  const u = registro(email)
  if (!u) return { ok: false, erro: 'Nenhuma conta cadastrada com este e-mail.' }
  if (!novaSenha || novaSenha.length < 4) return { ok: false, erro: 'A nova senha deve ter no mínimo 4 caracteres.' }
  const salvo = JSON.parse(localStorage.getItem(resetKey(u.login)) || 'null')
  if (!salvo) return { ok: false, erro: 'Nenhum código de recuperação gerado neste dispositivo.' }
  if (Date.now() > salvo.expira) {
    localStorage.removeItem(resetKey(u.login))
    return { ok: false, erro: 'Código expirado. Solicite um novo.' }
  }
  if (String(codigo).trim() !== salvo.codigo) return { ok: false, erro: 'Código incorreto.' }
  localStorage.removeItem(resetKey(u.login))
  if (u.papel === 'aluno' && u.aluno_id) await changePassword(u.aluno_id, novaSenha)
  const r = await definirSenha(u.login, novaSenha)
  return r.ok ? { ok: true } : r
}
