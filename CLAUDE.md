@AGENTS.md

# GlicoDiário

PWA responsivo para acompanhar glicemia (pré-diabetes/curiosidade, uso pessoal). Requisitos completos em `PROJETO.md`: leia antes de mudar regras de negócio.

## Sobre o usuário
A pessoa dona do projeto **não é desenvolvedora**. Explique em linguagem simples e dê instruções passo a passo (onde clicar, o que copiar) sempre que ela precisar agir, por exemplo no Supabase, no GitHub ou na Vercel. Trabalhe uma fase por vez e pare ao fim de cada uma para ela testar.

## Stack
Next.js 16 (App Router, `src/`), TypeScript, Tailwind 4, shadcn/ui (estilo base-nova, sobre `@base-ui/react`), lucide-react, Supabase (Auth + Postgres + RLS), Vitest e Playwright. Gráficos em SVG próprio, sem biblioteca. Offline: Dexie (fila no IndexedDB) + service worker escrito à mão (`public/sw.js`, sem Serwist).

## Comandos
- `npm run dev`: servidor local em http://localhost:3000
- `npm run typecheck`, `npm run lint`, `npm test` (Vitest), `npm run build`

## Rede corporativa
A rede usa um certificado próprio. O Node só acessa a internet com `--use-system-ca`: o script `dev` já inclui a opção, e em comandos avulsos use `NODE_OPTIONS=--use-system-ca` (ex.: `npx shadcn`).

## Convenções
- Interface 100% em português do Brasil. Rotas também em PT (`/inicio`, `/registrar`...).
- Datas: guardar em UTC e exibir em `America/Sao_Paulo`, usando os helpers de `src/lib/format.ts`.
- Unidade de glicemia: sempre mg/dL.
- Acessibilidade: alvos de toque de pelo menos 48px, a cor nunca é a única informação e o contraste segue WCAG AA.
- Cores de classificação: tokens `glu-normal`, `glu-attention`, `glu-high` e `glu-low` (ex.: `text-glu-high`).
- Linguagem: nunca diagnosticar. Dizer "acima da faixa de referência", nunca "você tem diabetes".
- Páginas logadas ficam em `src/app/(app)/`, com a navegação em `src/components/app-nav.tsx`.

## Autenticação e banco
- Supabase: clientes em `src/lib/supabase/` (`client.ts` para o navegador, `server.ts` para o servidor). O `src/proxy.ts` renova a sessão e redireciona para `/login` quem não está logado.
- Ações de login, cadastro, senha e logout ficam em `src/app/(auth)/actions.ts`. Os links enviados por e-mail caem em `src/app/auth/confirm/route.ts`.
- Schema do banco: arquivos em `supabase/migrations/`. Sem CLI: a pessoa aplica cada arquivo colando no SQL Editor do Supabase. **Todo arquivo novo de migração precisa ser informado a ela com instruções.**
- Toda tabela tem RLS (`user_id = auth.uid()`). Colunas em português, conforme o PROJETO.md §8.

## Regras de glicemia
- `src/lib/glucose/ranges.ts` (faixas, contextos, limites) e `classify.ts` (classificação) são a **única fonte** dessas regras: nunca repita números de faixa em componentes.
- Os limites de segurança (<54, <70, ≥250) têm prioridade sobre qualquer faixa, inclusive as personalizadas.
- Qualquer mudança nessas regras exige atualizar `classify.test.ts`.
- Para exibir: `GlucoseBadge` e `TOM_CLASSES` (`src/components/glucose-badge.tsx`).

## Dados e testes E2E
- Leitura no servidor: `src/lib/data/glucose.ts`. Escrita: Server Actions em `src/app/(app)/glicemia-actions.ts`, que chamam `revalidatePath("/", "layout")`.
- Tipos do banco escritos à mão em `src/lib/database.types.ts`: atualize junto com as migrações.
- Formulário de medição: `src/components/reading-form.tsx`. Valores de risco pedem confirmação antes de salvar.
- `npm run e2e` (já com `--use-system-ca`): Playwright com o Edge instalado (`channel: "msedge"`), em viewport de celular (390px) e desktop. Precisa de `E2E_EMAIL` e `E2E_PASSWORD` no `.env.local` (conta de teste confirmada) e usa o servidor dev já rodando, se houver.

## Registros complementares (refeição, atividade, peso)
- Regras e formatação em `src/lib/records.ts` (com testes). Leitura: `src/lib/data/records.ts`. Escrita e exclusão (de qualquer tipo): `src/app/(app)/registros-actions.ts`.
- Formulários em `src/components/record-forms.tsx`: `choiceClass` e `inputClass` são os estilos compartilhados de opções e campos.
- `/registrar?tipo=refeicao|atividade|peso` para as abas; a edição fica em `/historico/{refeicao|atividade|peso}/[id]` (glicemia: `/historico/[id]`).
- Uma glicemia `pos_1h`/`pos_2h` pode ter `meal_id`. A refeição das últimas 4h vem sugerida.
- Histórico: `TimelineByDay` (`src/components/reading-list.tsx`) mistura todos os tipos, e `?tipo=` filtra.
- Testes E2E: funções compartilhadas em `e2e/helpers.ts`. Todo teste apaga o que cria.

## Gráficos e resumo
- Cálculos puros e testados: `src/lib/stats.ts` (resumo de glicemia, peso e atividade) e `src/lib/chart.ts` (marcações dos eixos).
- `TimeChart` (`src/components/time-chart.tsx`) é o gráfico SVG genérico no tempo: uma única escala vertical, faixa sombreada opcional, fileira de refeições e atividades, e detalhes ao tocar ou passar o mouse. Os textos dos detalhes vêm prontos do servidor.
- Cores dos pontos: `TOM_CLASSES[tom].fill`. Texto nunca usa a cor da série.
- Página: `src/app/(app)/graficos/page.tsx` (`?periodo=7|30|90`, `?contexto=` filtra só o gráfico). Filtros em pílula: `src/components/chips.tsx`.
- Vitest resolve o atalho `@/` pelo `vitest.config.mts`.

## Ajustes (configurações)
- Ações em `src/app/(app)/configuracoes/actions.ts`. `saveRanges` guarda em `target_ranges` só os momentos diferentes do padrão, e `deleteAccount` chama a função `delete_my_account()` do banco depois da confirmação digitada "EXCLUIR".
- Editor de faixas: `src/components/ranges-form.tsx`. Exportação: `GET /configuracoes/exportar`, que gera o CSV com `src/lib/csv.ts` (separador `;`, vírgula decimal, BOM UTF-8, proteção contra fórmulas).
- Testes E2E que mudam faixas as restauram no `afterEach`, porque a conta de teste é compartilhada. A exclusão de conta **não** é testada de ponta a ponta, para não apagar a conta de teste.

## Sessão encerrada ou conta excluída
- O `proxy.ts` confere a assinatura do login (`getClaims`) **e** pergunta ao Supabase se usuário e sessão ainda existem (`sessaoInvalida`, em `src/lib/supabase/session-check.ts`). Se não existirem, apaga os cookies e leva para `/login?aviso=sessao-encerrada|conta-indisponivel`.
- Só desloga com resposta clara do Supabase. Falha de rede ou do servidor nunca desloga (ver `session-check.test.ts`).
- Atenção: a biblioteca converte `session_not_found` em `AuthSessionMissingError`.

## Relatório para o médico
- `src/app/(app)/relatorio/page.tsx` (`?periodo=7|30|90`), acessado pelo botão na tela de Gráficos. Reaproveita `stats.ts`, os componentes de `summary.tsx`, `TimeChart` e `ReferenceRanges`.
- Impressão: `print:hidden` nos controles, e a navegação usa `print:!hidden` para vencer o `md:flex`. `@media print` em `globals.css` define margem da página e mantém as cores. O `TimeChart` usa `viewBox` e se adapta à largura da folha.
- Para conferir o PDF: `page.emulateMedia({ media: "print" })` + `page.pdf()` no Playwright.
- Scripts avulsos que reaproveitam `e2e/.auth/user.json` depois de mais de 1h caem no login ("sessão encerrada"), porque o token de renovação já foi trocado. Nesse caso, rode antes `npm run e2e -- --project=setup`.

## PWA e modo offline
- **Validação única:** `src/lib/parse-records.ts` lê e valida os formulários, e é usado pelas Server Actions e pela fila offline. Mudou uma regra? Mude ali e em `parse-records.test.ts`.
- **Fila offline:** `src/lib/offline/queue.ts` (Dexie, banco `glicodiario`, tabela `pendentes`).
  - Cada item tem `id` gerado no aparelho, igual ao id final no banco (`novo_id` no formulário); o erro 23505 no reenvio conta como sucesso.
  - Cada item guarda também `userId`: só é enviado com a sessão do dono.
- **Formulários:** `criarOuEnfileirar` e `editarComRede` (`src/lib/offline/salvar.ts`). Criação sem rede vai para a fila; edição e exclusão sem rede mostram aviso. Use `unstable_rethrow` ao capturar erros de Server Actions.
- **Estado e aviso:** `OfflineProvider` (no layout logado) guarda o estado e envia a fila ao abrir o app, quando a internet volta e a cada 30s. `SyncStatus` mostra os avisos.
- **Service worker:** `public/sw.js`, registrado **só em produção** (`ServiceWorkerRegister`).
  - Estáticos: cache-first. Páginas e RSC: rede primeiro, cópia guardada como reserva; tela nunca visitada mostra `/offline`.
  - Nunca guarda login, links de e-mail nem o CSV.
  - Ao mudar o arquivo, aumente `VERSAO`.
  - As telas de login mandam `limpar-dados` para apagar as páginas guardadas.
- **Manifesto e ícones:** `src/app/manifest.ts`, `public/icons/*`, `src/app/icon.svg`, `src/app/apple-icon.png`. `/sw.js`, `/manifest.webmanifest` e `/offline` não passam pelo login (matcher do proxy e `PUBLIC_PATHS`).
- **Testar o service worker:** `npm run build`, `node --use-system-ca node_modules/next/dist/bin/next start -p 3001` e `PWA_URL=http://localhost:3001 npm run e2e:pwa`.
- **Instalação exige HTTPS** (ou localhost). No Wi-Fi local por `http://192.168…` o celular não instala nem usa o service worker. A fila funciona, com um UUID alternativo.
- **"Sair"** usa `signOut({ scope: "local" })`: só este aparelho. O padrão da biblioteca encerraria a conta em todos os aparelhos.
- **Testes E2E que clicam em "Sair"** devem usar sessão própria (`storageState` vazio + login na tela): a sessão do setup é compartilhada.
