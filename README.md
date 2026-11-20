# Portal do Aluno — Studio Funcional In Life

Aplicação web ( React + Vite + Tailwind v4 ) do **Portal do Aluno** para o programa de
treinamento gamificado de 8 semanas. Os dados vêm diretamente da planilha de gestão
(`plano_treino_studio.xlsx`), extraídos para JSON em `src/data/`.

## Funcionalidades

- **Login** por e-mail cadastrado (10 alunos de demonstração).
- **Início**: avatar/nível de herói, progresso de XP, posição no ranking, adesão, streak,
  treino do dia (por dia da semana) e gráfico de XP por semana.
- **Meus Treinos**: programa completo 8 semanas × 4 fases, sessões por dia com blocos,
  exercícios, séries/reps, PSE (Borg CR-10), descanso, link de vídeo e marcação de
  exercícios concluídos (salvo localmente).
- **Evolução**: comparação início × semana 8 (peso, IMC, % gordura, cintura, 1RM,
  prancha, caminhada 6min, FC repouso) com score de evolução 0–7.
- **Avaliações**: antropometria (IMC, PA, duplo produto, RCQ), funcional (FMS, 1RM, testes),
  anamnese (doenças, medicamentos, liberação médica, restrições), avaliação do movimento
  (8 testes, compensações e correções), check-list multifuncional (Guiselini) e equilíbrio
  T.A.S.V.M. por pilar.
- **Bem-Estar**: sono, estresse, meta de hidratação, TMB (Mifflin-St Jeor) e gasto calórico.
- **Saúde**: triagem de síndrome metabólica (NCEP-ATP III / IDF), liberação cardiovascular
  e referências de segurança para hipertensos e diabéticos.
- **Ranking**: leaderboard por XP, semanas com presença 100%, regras de XP, badges e
  escada de avatares.
- **Instrutor**: painel de todos os alunos (PA, duplo produto, recuperação, síndrome
  metabólica, equilíbrio T.A.S.V.M.), alertas automáticos de saúde/adesão, cronômetro de
  sessão (Iniciar/Finalizar, com tabela para colar na coluna 'Duração da Sessão (min)' da
  aba Frequencia_XP ou baixar CSV — mesmo fluxo do dashboard original) e exportação CSV
  (alunos, ranking, frequência/XP, triagem metabólica, volume load) + PDF via impressão.
- **Senha**: login com verificação SHA-256 (`senha_hash` por aluno; padrão de demonstração
  `studio<id>`, trocável pelo aluno no topo). Observação: por ser um site estático, a
  autenticação é client-side — para produção com dados sensíveis, integre um backend
  (Supabase/Firebase) antes de distribuir acessos reais.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # produção (dist/)
```

## Regenerar dados da planilha

```bash
pip install openpyxl
python3 extract_data.py   # lê o .xlsx e regrava os JSONs em src/data/
```

## Metodologia

Periodização em 4 fases (2 semanas cada): Estabilização → Resistência de Força →
Força Máxima → Potência Funcional. Sessões de 60 min com 4 blocos (Preparação,
Neuromuscular I, Neuromuscular II e Cardiometabólico) + recuperação ativa aos sábados.
Gamificação: XP por presença/meta/zona de FC, streak semanal, badges, avatares estilo
super-herói e ranking com desempate.

## Deploy (GitHub Pages)

O push na `main` dispara o workflow `.github/workflows/deploy.yml`, que faz o build e
publica automaticamente em GitHub Pages.
