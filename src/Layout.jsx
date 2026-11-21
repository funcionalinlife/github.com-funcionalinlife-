import { db } from './data.js'
import { changePassword } from './auth.js'
import { trocarSenhaPropria } from './usuarios.js'

export function TrocarSenha({ aluno, sessao }) {
  const trocar = async () => {
    const nova = prompt('Nova senha (mínimo 4 caracteres):')
    if (nova === null) return
    const confirmacao = prompt('Confirme a nova senha:')
    const r = sessao
      ? await trocarSenhaPropria(sessao, nova, confirmacao)
      : nova === confirmacao
        ? { ok: await changePassword(aluno.id, nova) }
        : { ok: false, erro: 'As senhas não conferem.' }
    alert(r.ok ? 'Senha alterada com sucesso!' : r.erro || 'Senha inválida (mínimo 4 caracteres).')
  }
  const titulo = sessao ? 'Trocar minha senha' : 'Trocar senha'
  return (
    <button className="btn-ghost !px-3 !py-1.5" onClick={trocar} title={titulo}>
      🔑 Trocar senha
    </button>
  )
}

const ITENS = [
  ['home', '🏠', 'Início'],
  ['treinos', '🏋️', 'Meus Treinos'],
  ['evolucao', '📈', 'Evolução'],
  ['avaliacoes', '📋', 'Avaliações'],
  ['bem-estar', '😴', 'Bem-Estar'],
  ['saude', '🩺', 'Saúde'],
  ['ranking', '🏆', 'Ranking'],
  ['instrutor', '🧑‍🏫', 'Instrutor'],
]

const ITENS_EQUIPE = [
  ['instrutor', '🧑‍🏫', 'Instrutor'],
  ['alunos', '👥', 'Alunos'],
  ['usuarios', '⚙️', 'Usuários'],
]

export default function Layout({ aluno, sessao, rota, onSair, children }) {
  const equipe = sessao && (sessao.papel === 'admin' || sessao.papel === 'professor') || false
  const itens = equipe ? ITENS_EQUIPE : ITENS
  const papelLabel = { admin: 'Administrador', professor: 'Professor', aluno: 'Aluno' }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-500 text-lg">💪</div>
            <div>
              <div className="text-sm font-bold leading-tight">Funcional In Life — Portal do Aluno</div>
              <div className="text-xs text-zinc-500">Programa gamificado de 8 semanas</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{equipe ? sessao.nome : aluno.nomecompleto}</div>
              <div className="text-xs text-zinc-500">
                {equipe ? papelLabel[sessao.papel] : `${aluno.n_velatual} · ${aluno.xptotal} XP`}
              </div>
            </div>
            <TrocarSenha aluno={aluno} sessao={sessao} />
            <button className="btn-ghost !px-3 !py-1.5" onClick={onSair}>Sair</button>
          </div>
        </div>
        {db.notices.length > 0 && (
          <div className="overflow-hidden border-t border-zinc-800/60 bg-zinc-900/60">
            <div className="mx-auto max-w-6xl whitespace-nowrap py-1.5 text-xs text-lime-300">
              <span className="animate-[marquee_28s_linear_infinite] inline-block">
                {db.notices.map((n) => `  ${n.mensagem}  •`).join('')}
              </span>
            </div>
          </div>
        )}
        <nav className="border-t border-zinc-800/60">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3">
            {itens
              .filter(([id]) => id !== 'usuarios' || (equipe && (sessao.papel === 'admin' || sessao.permissoes.includes('gerenciar_usuarios'))))
              .map(([id, icone, label]) => (
              <a
                key={id}
                href={`#/${id}`}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
                  rota === id
                    ? 'border-lime-500 text-lime-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{icone}</span> {label}
              </a>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-600">
        Studio de Performance Funcional In Life · dados originados da planilha de gestão do programa
      </footer>
      <style>{`@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
    </div>
  )
}
