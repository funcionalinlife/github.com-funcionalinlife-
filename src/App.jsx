import { useEffect, useState } from 'react'
import Login from './Login.jsx'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import Treinos from './pages/Treinos.jsx'
import Evolucao from './pages/Evolucao.jsx'
import Avaliacoes from './pages/Avaliacoes.jsx'
import BemEstar from './pages/BemEstar.jsx'
import Saude from './pages/Saude.jsx'
import Ranking from './pages/Ranking.jsx'
import Instrutor from './pages/Instrutor.jsx'
import Usuarios from './pages/Usuarios.jsx'
import SetupAdmin from './pages/SetupAdmin.jsx'
import { db } from './data.js'
import { getSessao, clearSessao, temAdmin } from './usuarios.js'

const rotas = {
  home: Home,
  treinos: Treinos,
  evolucao: Evolucao,
  avaliacoes: Avaliacoes,
  'bem-estar': BemEstar,
  saude: Saude,
  ranking: Ranking,
  instrutor: Instrutor,
  usuarios: Usuarios,
}

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.replace('#/', '') || 'home')
  useEffect(() => {
    const on = () => setHash(window.location.hash.replace('#/', '') || 'home')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('portal_user_id'))
  const [sessao, setSessao] = useState(() => getSessao())
  const [pronto, setPronto] = useState(() => temAdmin())
  const rota = useHashRoute()
  const equipe = sessao && (sessao.papel === 'admin' || sessao.papel === 'professor')

  const onEnter = (aluno) => {
    localStorage.setItem('portal_user_id', String(aluno.id))
    setUserId(String(aluno.id))
    window.location.hash = '#/home'
  }

  const onEquipe = (s) => {
    setSessao(s)
    window.location.hash = `#/${s.permissoes.includes('gerenciar_usuarios') ? 'usuarios' : 'instrutor'}`
  }

  const onConcluidoAdmin = (s) => {
    setPronto(true)
    setSessao(s)
    window.location.hash = '#/usuarios'
  }

  const sair = () => {
    localStorage.removeItem('portal_user_id')
    clearSessao()
    setUserId(null)
    setSessao(null)
  }

  if (!pronto || (!userId && !equipe)) {
    if (!pronto) return <SetupAdmin onConcluido={onConcluidoAdmin} />
    return <Login onEnter={onEnter} onEquipe={onEquipe} />
  }

  if (equipe) {
    const podeUsuarios = sessao.papel === 'admin' || sessao.permissoes.includes('gerenciar_usuarios')
    const rotaEfetiva = (rota === 'usuarios' && !podeUsuarios) || !rotas[rota] ? 'instrutor' : rota
    const Pagina = rotas[rotaEfetiva]
    return (
      <Layout sessao={sessao} rota={rotaEfetiva} onSair={sair}>
        <Pagina sessao={sessao} />
      </Layout>
    )
  }

  const aluno = db.students.find((a) => Number(a.id) === Number(userId))
  if (!aluno) {
    sair()
    return null
  }
  const rotaPadrao = rota === 'usuarios' ? 'home' : rota
  const Pagina = rotas[rotaPadrao] || Home
  return (
    <Layout aluno={aluno} sessao={sessao} rota={rotaPadrao} onSair={sair}>
      <Pagina aluno={aluno} />
    </Layout>
  )
}
