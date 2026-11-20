"""Extrai as abas da planilha plano_treino_studio.xlsx para JSON estruturado em src/data/."""
import json
import os
import re

import openpyxl

XLSX = '/mnt/vibefs/uploads/8b3864e4-f4fb-4767-a64d-7dd8347c10de/sQoHaLLt-plano_treino_studio.xlsx'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'data')
os.makedirs(OUT, exist_ok=True)

wb = openpyxl.load_workbook(XLSX, data_only=True)


def rows_of(sheet):
    """Linhas não vazias da aba como listas de strings."""
    out = []
    for row in wb[sheet].iter_rows(values_only=True):
        if any(c is not None and str(c).strip() != '' for c in row):
            vals = []
            for c in row:
                if c is None:
                    vals.append('')
                elif hasattr(c, 'isoformat'):
                    vals.append(c.date().isoformat() if hasattr(c, 'date') else str(c))
                else:
                    vals.append(str(c).strip())
            out.append(vals)
    return out


def num(v):
    if v is None or v == '':
        return None
    s = str(v).replace(',', '.')
    try:
        f = float(s)
        return int(f) if f.is_integer() and '.' not in s and 'e' not in s.lower() else round(f, 2)
    except ValueError:
        return v


def hdr_exact(rows, key='ID'):
    return next(i for i, row in enumerate(rows) if row[0] == key)


def find_row(rows, text, start=0):
    for i in range(start, len(rows)):
        if any(text.lower() in c.lower() for c in rows[i]):
            return i
    raise LookupError(text)


def keyify(s):
    s = s.strip()
    clean = []
    asc = True
    for ch in s:
        clean.append(ch if ch.isascii() else '_')
    out = ''.join(clean).lower()
    res = ''
    prev_us = False
    for ch in out:
        if ch.isalnum() or ch == '_':
            if ch == '_' and prev_us:
                continue
            prev_us = ch == '_'
            res += ch
    return res.strip('_')


def table_from(rows, header_idx, end_pred=None, casts=None):
    """Parseia tabela a partir da linha do cabeçalho; retorna lista de dicts."""
    headers = [keyify(h) for h in rows[header_idx]]
    casts = casts or []
    out = []
    for row in rows[header_idx + 1:]:
        if not any(c.strip() for c in row[:len(headers)]) or (end_pred and end_pred(row)):
            break
        rec = {}
        for i, h in enumerate(headers):
            if h:
                v = row[i] if i < len(row) else ''
                if casts is True or (casts and h in casts):
                    v = num(v)
                rec[h] = v
        if any(str(v) for v in rec.values()):
            out.append(rec)
    return out


data = {}

# 1) Cadastro de alunos
r = rows_of('Cadastro_Alunos')
hdr = find_row(r, 'ID')
data['students'] = table_from(r, hdr, casts=True)
for s in data['students']:
    s['data_nascimento'] = (s.get('data_nascimento') or '')[:10]
    s['data_cadastro'] = (s.get('data_cadastro') or '')[:10]

# 2) Antropometria
r = rows_of('Antropometria')
hdr = find_row(r, 'ID')
data['anthropometry'] = table_from(r, hdr, casts=True)

# 3) Avaliação funcional
r = rows_of('Avaliacao_Funcional')
hdr = find_row(r, 'ID')
data['functional'] = table_from(r, hdr, casts=True)

# 4) Anamnese
r = rows_of('Anamnese')
hdr = hdr_exact(r)
data['anamnesis'] = table_from(r, hdr, casts=True)

# 5) Zonas de FC (tabela de objetivos + por aluno)
r = rows_of('Zonas_FC')
h1 = find_row(r, 'Objetivo Principal')
obj_end = find_row(r, 'ID')
data['hr_zone_targets'] = table_from(r, h1, end_pred=lambda row: str(row[0]).strip().lower() == 'id')
hz_hdr = next(i for i, row in enumerate(r) if row[0] == 'ID' and i > h1)
data['hr_zones'] = table_from(r, hz_hdr, casts=True)

# 6) Sono / estresse / metabolismo
r = rows_of('Sono_Estresse_Metabolismo')
hdr = hdr_exact(r)
data['wellbeing'] = table_from(r, hdr, casts=True)

# 7) Evolução do aluno (reavaliação + calculado)
r = rows_of('Evolucao_Aluno')
h1 = hdr_exact(r)
mid = next(i for i, row in enumerate(r) if 'peso in' in ' '.join(row).lower() and str(row[0]).strip() == 'ID')
data['reassessment'] = []
for row in r[h1 + 1:mid - 1]:
    if str(row[0]).strip().isdigit():
        data['reassessment'].append(dict(zip([keyify(x) for x in r[h1]], [num(v) for v in row])))
ev = table_from(r, mid, casts=True)
cut = []
for rec in ev:
    if isinstance(rec.get('id'), (int, float)):
        if cut and rec['id'] <= cut[-1]['id']:
            break
        cut.append(rec)
data['evolution'] = cut

# 8) Triagem síndrome metabólica por aluno
r = rows_of('Sindrome_Metabolica')
hdr = find_row(r, 'AVALIAÇÃO E DIAGNÓSTICO POR ALUNO')
data['metabolic_screening'] = table_from(r, hdr + 1, casts=True)

# 9) Avaliação do movimento: referência dos 8 testes + resultados por aluno
r = rows_of('Avaliacao_Movimento')
ref_hdr = next(i for i, row in enumerate(r) if row[0] == 'Nº')
data['movement_reference'] = table_from(r, ref_hdr, end_pred=lambda row: not str(row[0]).strip().isdigit())
mov = []
for row in r[ref_hdr + len(data['movement_reference']) + 1:]:
    if str(row[0]).strip().isdigit() and len(row) > 8 and str(row[2]).strip().isdigit() and num(row[2]) <= 8:
        mov.append({
            'id': num(row[0]), 'nome': row[1], 'teste_n': num(row[2]), 'pilar': row[3],
            'teste': row[4], 'flags': [f for f in row[5:8] if f],
            'problema': row[8],
            'correcao': ' | '.join([c for c in row[9:] if c]),
        })
data['movement_tests'] = mov
ms_hdr = next(i for i, row in enumerate(r) if row[0] == 'ID' and 'Total de Compensa' in ' '.join(row))
data['movement_summary'] = table_from(r, ms_hdr, casts=True)

# 10) Avaliação multifuncional: resumo por aluno + testes referência
r = rows_of('Avaliacao_Multifuncional')
resum = find_row(r, 'RESUMO')
data['multifunctional_summary'] = []
for row in r[resum + 2:]:
    if len(row) > 2 and str(row[0]).strip().isdigit():
        data['multifunctional_summary'].append({
            'id': num(row[0]), 'nome': row[1], 'itens_com_compensacao': num(row[2]),
        })
mfr = []
for row in r[:resum]:
    if str(row[0]).strip().isdigit() and len(row) > 4 and not str(row[2]).strip().isdigit():
        mfr.append({'id': num(row[0]), 'nome': row[1], 'teste': row[2], 'regiao': row[3],
                    'item': row[4], 'lado': row[5], 'valor': num(row[6]) if len(row) > 6 else '',
                    'classificacao': row[7] if len(row) > 7 else ''})
data['multifunctional_records'] = mfr
tests = {}
for row in r[:resum]:
    m = re.match(r'TESTE (\d+) — (.+)', row[0])
    if m:
        tests[m.group(1)] = m.group(2).strip()
data['multifunctional_tests_ref'] = [{'n': int(k), 'nome': v} for k, v in sorted(tests.items(), key=lambda x: int(x[0]))]

# 11) Plano de treino com preenchimento para frente das colunas de sessão
r = rows_of('Plano_Treino')
hdr = find_row(r, 'Sessão')
plan = []
cur = {}
for row in r[hdr + 1:]:
    if not any(c.strip() for c in row):
        continue
    sess = str(row[0]).strip()
    if sess.isdigit() and sess != cur.get('sessao_id'):
        cur = {
            'sessao_id': int(sess), 'semana': num(row[1]), 'fase': row[2],
            'dia': row[3], 'objetivo_dia': row[4], 'capacidade': row[5], 'blocos': [],
        }
        plan.append(cur)
    bloco = {
        'bloco': row[6], 'duracao_min': num(row[7]), 'padrao': row[8], 'exercicio': row[9],
        'series': row[10], 'reps': row[11], 'pse': num(row[12]), 'pse_class': row[13],
        'descanso': row[14], 'video': row[15] if len(row) > 15 else '',
    }
    cur['blocos'].append(bloco)
data['workout_plan'] = plan

# hyperlinks dos vídeos (coluna P)
wb2 = openpyxl.load_workbook(XLSX, data_only=False)
ws2 = wb2['Plano_Treino']
video_links = {}
for roww in ws2.iter_rows(min_row=ws2.min_row, max_row=ws2.max_row, values_only=False):
    c = roww[15] if len(roww) > 15 else None
    if c is not None and c.hyperlink is not None:
        video_links[c.value] = c.hyperlink.target
data['video_links'] = video_links

# 12) Frequência e XP por sessão
r = rows_of('Frequencia_XP')
hdr = find_row(r, 'ID Aluno')
data['attendance'] = table_from(r, hdr, casts=True)

# 13) Frequência semanal (semanas 100%)
r = rows_of('Frequencia_Semanal')
hdr = find_row(r, 'ID')
wp = table_from(r, hdr, casts=True)
data['weekly_perfect'] = [rec for rec in wp if isinstance(rec.get('totalsemanasperfeitas'), (int, float))]

# 14) Ranking
r = rows_of('Ranking')
hdr = find_row(r, 'Posição')
data['ranking'] = table_from(r, hdr, casts=True)

# 15) Gamificação: regras + badges + XP máximo
r = rows_of('Gamificacao_Regras')
hdr = next(i for i, row in enumerate(r) if row[0] == 'Regra')
rules = table_from(r, hdr, end_pred=lambda row: 'XP MÁXIMO' in str(row[0]).upper() or not any(row[:2]))
data['xp_rules'] = rules
b = next(i for i, row in enumerate(r) if row[0] == 'Badge')
data['badges'] = table_from(r, b, end_pred=lambda row: not any(row[:2]))

# 16) Avatares
r = rows_of('Avatares')
hdr = find_row(r, 'Nível')
av = table_from(r, hdr, casts=True)
data['avatars'] = [a for a in av if isinstance(a.get('xpm_nimo'), (int, float))]

# 17) Grade de horários
r = rows_of('Grade_Horarios')
hdr = next(i for i, row in enumerate(r) if row[0] == 'Turno')
data['schedule'] = table_from(r, hdr)

# 18) Avisos do studio
r = rows_of('Avisos_Studio')
hdr = next(i for i, row in enumerate(r) if row[0] == 'Ordem')
data['notices'] = [n for n in table_from(r, hdr) if n.get('ativosn').upper() == 'S']
data['notices_all'] = table_from(r, hdr)

# 19) T.A.S.V.M.: pilares, métodos, matriz, avaliação por aluno
r = rows_of('Metodo_TASVM')
h = find_row(r, 'Nível')
hdr = h + 1
data['tasvm_pillars'] = table_from(r, hdr, end_pred=lambda row: not any(row[:4]))
h = find_row(r, 'MÉTODOS DE SOBRECARGA')
data['tasvm_overload'] = table_from(r, h + 1, end_pred=lambda row: not any(row[:2]))
h = find_row(r, 'MÉTODOS DE TREINO AVANÇADOS')
data['tasvm_methods'] = table_from(r, h + 1, end_pred=lambda row: not any(row[:2]))
h = find_row(r, 'Foco de Correção T.A.S.V.M.')
data['tasvm_matrix'] = table_from(r, h, end_pred=lambda row: not any(row[:2]) or 'Equilíbrio' in row[0])
h = find_row(r, 'Foco de Correção Recomendado')
data['tasvm_students'] = table_from(r, h, casts=True)

# 20) Volume Load
r = rows_of('Volume_Load')
hdr = find_row(r, 'ID Aluno')
data['volume_load'] = table_from(r, hdr, casts=True)

# 21) Como usar (texto)
r = rows_of('Como_Usar')
data['how_to_use'] = [c for row in r for c in row if c]

# 22) Capa (metadados do programa)
r = rows_of('Capa')
data['program_meta'] = {
    'titulo': 'PROGRAMA DE TREINAMENTO GAMIFICADO — 8 SEMANAS',
    'linha1': r[7][2], 'linha2': r[8][2],
}

for t in ['students', 'anthropometry', 'functional', 'anamnesis', 'hr_zones',
    'wellbeing', 'reassessment', 'evolution', 'metabolic_screening', 'multifunctional_summary',
    'ranking', 'tasvm_students']:
    rows = []
    seen = set()
    for rec in data[t]:
        rec['id'] = num(rec.get('id'))
        if not isinstance(rec['id'], (int, float)) or rec['id'] in seen:
            continue
        seen.add(rec['id'])
        if isinstance(rec['id'], float) and rec['id'].is_integer():
            rec['id'] = int(rec['id'])
        rows.append(rec)
    data[t] = rows

data['attendance'] = [rec for rec in data['attendance'] if isinstance(rec.get('idaluno'), (int, float))]
data['volume_load'] = [rec for rec in data['volume_load'] if isinstance(rec.get('idaluno'), (int, float))]
mseen, mov = set(), []
for rec in data['movement_tests']:
    k = (rec['id'], rec['teste_n'])
    if k in mseen:
        continue
    mseen.add(k)
    mov.append(rec)
data['movement_tests'] = mov

import hashlib
for s in data['students']:
    s['senha_hash'] = hashlib.sha256(f"studio{s['id']}".encode()).hexdigest()

for name, obj in data.items():
    with open(os.path.join(OUT, f'{name}.json'), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

print(f'{len(data)} arquivos JSON gerados em {OUT}')
