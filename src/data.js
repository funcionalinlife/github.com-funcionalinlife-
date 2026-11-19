import students from './data/students.json'
import anthropometry from './data/anthropometry.json'
import functional from './data/functional.json'
import anamnesis from './data/anamnesis.json'
import hrZones from './data/hr_zones.json'
import hrZoneTargets from './data/hr_zone_targets.json'
import wellbeing from './data/wellbeing.json'
import evolution from './data/evolution.json'
import reassessment from './data/reassessment.json'
import metabolicScreening from './data/metabolic_screening.json'
import movementTests from './data/movement_tests.json'
import movementReference from './data/movement_reference.json'
import movementSummary from './data/movement_summary.json'
import multifunctionalSummary from './data/multifunctional_summary.json'
import multifunctionalRecords from './data/multifunctional_records.json'
import multifunctionalTestsRef from './data/multifunctional_tests_ref.json'
import workoutPlan from './data/workout_plan.json'
import attendance from './data/attendance.json'
import weeklyPerfect from './data/weekly_perfect.json'
import ranking from './data/ranking.json'
import avatars from './data/avatars.json'
import badges from './data/badges.json'
import xpRules from './data/xp_rules.json'
import schedule from './data/schedule.json'
import notices from './data/notices.json'
import tasvmStudents from './data/tasvm_students.json'
import tasvmPillars from './data/tasvm_pillars.json'
import tasvmOverload from './data/tasvm_overload.json'
import tasvmMethods from './data/tasvm_methods.json'
import tasvmMatrix from './data/tasvm_matrix.json'
import volumeLoad from './data/volume_load.json'
import programMeta from './data/program_meta.json'

export const db = {
  students, anthropometry, functional, anamnesis, hrZones, hrZoneTargets, wellbeing,
  evolution, reassessment, metabolicScreening, movementTests, movementReference,
  movementSummary, multifunctionalSummary, multifunctionalRecords, multifunctionalTestsRef,
  workoutPlan, attendance, weeklyPerfect, ranking, avatars, badges, xpRules, schedule,
  notices, tasvmStudents, tasvmPillars, tasvmOverload, tasvmMethods, tasvmMatrix,
  volumeLoad, programMeta,
}

export const byId = (list, id) => list.find((r) => Number(r.id) === Number(id))
export const byAluno = (list, id) => list.filter((r) => Number(r.idaluno) === Number(id))

export const DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const HOJE_IDX = (new Date().getDay() + 6) % 7

export const xpProNivel = (xp) => {
  const lados = avatars
  let atual = lados[0]
  for (const a of lados) if (Number(xp) >= Number(a['xpm_nimo'])) atual = a
  const idx = lados.indexOf(atual)
  const prox = lados[idx + 1] || null
  return { atual, prox, base: Number(atual['xpm_nimo']), teto: prox ? Number(prox['xpm_nimo']) : null }
}

export const metricsAluno = (id) => {
  const att = byAluno(attendance, id)
  const presencas = att.filter((a) => a['presen_asn'] === 'S').length
  const total = att.length || 1
  const xpSessoes = att.filter((a) => a['presen_asn'] === 'S').reduce((s, a) => s + Number(a['xpdasess_o'] || 0), 0)
  const xpPenal = att.filter((a) => a['presen_asn'] !== 'S').reduce((s, a) => s + Number(a['xpdasess_o'] || 0), 0)
  const xpTotal = Number(byId(students, id)?.xptotal ?? xpSessoes + xpPenal)
  const streakAtual = (() => {
    let s = 0
    for (let i = att.length - 1; i >= 0; i--) {
      if (att[i]['presen_asn'] === 'S') s++
      else break
    }
    return s
  })()
  const porSemana = {}
  for (const a of att) {
    porSemana[a.semana] = porSemana[a.semana] || { pres: 0, total: 0, xp: 0 }
    porSemana[a.semana].total++
    if (a['presen_asn'] === 'S') {
      porSemana[a.semana].pres++
      porSemana[a.semana].xp += Number(a['xpdasess_o'] || 0)
    }
  }
  const minutos = att.filter((a) => a['presen_asn'] === 'S').reduce((s, a) => s + Number(a['dura_odasess_omin'] || 0), 0)
  return {
    presencas, total, adesao: presencas / total, xpTotal, xpSessoes, streakAtual,
    porSemana, minutos, posNoRanking: byId(students, id)?.posi_onoranking,
  }
}

export const sessionHoje = (semana) => {
  const ehDomingo = new Date().getDay() === 0
  const alvo = ehDomingo ? 'Domingo' : DIAS[HOJE_IDX]
  const dia = ehDomingo
    ? null
    : workoutPlan.find((s) => s.dia === alvo && String(s.semana) === String(semana))
  return { dia, alvo, idx: ehDomingo ? -1 : HOJE_IDX }
}

export const youtubeLink = (exercicio) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(exercicio + ' exercício')}`
