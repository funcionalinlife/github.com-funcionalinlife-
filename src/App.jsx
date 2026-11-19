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
import { db } from './data.js'

const rotas = {
  home: Home,
  treinos: Treinos,
  evolucao: Evolucao,
  avaliacoes: Avaliacoes,
  'bem-estar': BemEstar,
  saude: Saude,
  ranking: Ranking,
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
  const rota = useHashRoute()

  const onEnter = (email) => {
    const aluno = db.students.find((a) => a.email.trim().toLowerCase() === (email || '').trim().toLowerCase())
    if (!aluno) {
      alert('E-mail não encontrado no cadastro do studio.')
      return
    }
    localStorage.setItem('portal_user_id', String(aluno.id))
    setUserId(String(aluno.id))
    window.location.hash = '#/home'
  }

  const sair = () => {
    localStorage.removeItem('portal_user_id')
    setUserId(null)
  }

  if (!userId) return <Login onEnter={onEnter} />

  const aluno = db.students.find((a) => Number(a.id) === Number(userId))
  if (!aluno) {
    sair()
    return null
  }

  const Pagina = rotas[rota] || Home
  return (
    <Layout aluno={aluno} rota={rota} onSair={sair}>
      <Pagina aluno={aluno} />
    </Layout>
  )
}
