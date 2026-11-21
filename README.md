# Portal do Aluno — Studio Funcional In Life

Aplicação web ( React + Vite + Tailwind v4 ) do **Portal do Aluno** para o programa de
treinamento gamificado de 8 semanas. A planilha de gestão (`plano_treino_studio.xlsx`)
foi o **modelo original** e não é uma dependência: o programa está embutido no app
(`src/data/`) e a gestão de alunos/credenciais é feita dentro do próprio sistema.

## Funcionalidades

- **Login** com 4 modos: Aluno (exemplos ou cadastrados pelo admin), Equipe
  (admin/professor), Cadastrar-se e Recuperar senha.
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
  metabólica, equilíbrio T.A.S.V.M.) com filtro por risco, alertas automáticos de
  saúde/adesão, gráfico de carga semanal (volume load), cronômetro de sessão
  (Iniciar/Finalizar, com tabela para colar na coluna 'Duração da Sessão (min)' da
  aba Frequencia_XP ou baixar CSV — mesmo fluxo do dashboard original), revisão de
  registros dos alunos (aprovar/corrigir marcações) e exportação CSV (alunos, ranking,
  frequência/XP, triagem metabólica, volume load) + PDF via impressão.
- **Credenciais e papéis**: no 1º acesso o portal pede a criação do **administrador**
  (login/e-mail, senha, WhatsApp e permissões). A partir daí o login tem 4 modos:
  **Aluno** (senha padrão `studio<id>`, trocável no topo), **Equipe** (admin/professor com
  suas senhas), **Cadastrar** (auto-cadastro de aluno com e-mail + WhatsApp — fica
  *Pendente* até o admin aprovar na aba ⚙️ Usuários) e **Recuperar** (código de 6 dígitos
  com 15 min de validade; alunos redefinem a senha, contas ficam na aba Usuários).
  Hashes SHA-256 client-side. **Modo híbrido**: sem backend, as contas funcionam no
  dispositivo (navegador); na aba Usuários o admin pode colar Project URL + anon key de um
  projeto gratuito do Supabase (Settings → API) para ativar **recuperação por e-mail real**
  e cadastro/login via Supabase Auth (REST, sem dependências). Para produção com dados
  sensíveis multi-dispositivo, migre o restante das contas/dados para o backend.

## Equipe

- **Administrador e professor** entram pela aba 🧑‍\u200d🏫 Equipe do login e têm duas abas: **Instrutor**
  (painel, alertas, cronômetro, exports) e **👥 Alunos** (cadastro de alunos com nome, e-mail,
  WhatsApp, objetivo, turno e senha inicial). **⚙️ Usuários** (papéis, aprovações,
  redefinição de credenciais, Supabase) é exclusiva do administrador.

## Independência da planilha

- O **programa de treinamento** (8 semanas × 4 fases, 48 sessões com blocos, exercícios,
  séries/reps, PSE, links de vídeo) está **embutido no app** e vale para qualquer aluno
  cadastrado.
- **Alunos são cadastrados no app** (⚙️ Usuários → Alunos do programa), com credenciais
  próprias, sem precisar existir em planilha alguma.
- Os 10 alunos com dados preenchidos são **dados de exemplo**: podem ser ocultados com
  um clique no interruptor da aba Usuários (`portal_demo`), deixando o portal só com os
  alunos reais.
- Páginas de evolução/avaliações/saúde mostram estados vazios amigáveis para alunos sem
  registros.
- `extract_data.py` permanece como **importador opcional**: se você editar a planilha
  original, rodá-lo regenera os dados de exemplo (`src/data/`).

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
