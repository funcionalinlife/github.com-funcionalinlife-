export async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const overrideKey = (id) => `portal_senha_${id}`

export async function verifyLogin(senha, hashPadrao, alunoId) {
  const override = localStorage.getItem(overrideKey(alunoId))
  const alvo = override || hashPadrao
  if (!senha) return false
  return (await sha256hex(senha)) === alvo
}

export async function changePassword(alunoId, novaSenha) {
  if (!novaSenha || novaSenha.length < 4) return false
  localStorage.setItem(overrideKey(alunoId), await sha256hex(novaSenha))
  return true
}
