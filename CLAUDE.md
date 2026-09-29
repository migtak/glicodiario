@AGENTS.md

# GlicoDiário

PWA responsivo para acompanhar glicemia (pré-diabetes/curiosidade, uso pessoal). Requisitos completos em `PROJETO.md`: leia antes de mudar regras de negócio.

## Sobre o usuário
A pessoa dona do projeto **não é desenvolvedora**. Explique em linguagem simples e dê instruções passo a passo (onde clicar, o que copiar) sempre que ela precisar agir, por exemplo no Supabase, no GitHub ou na Vercel. Trabalhe uma fase por vez e pare ao fim de cada uma para ela testar.

## Stack
Next.js 16 (App Router, `src/`), TypeScript, Tailwind 4, shadcn/ui (estilo base-nova, sobre `@base-ui/react`), lucide-react, Supabase (Auth + Postgres + RLS). Ainda por vir: Recharts, Dexie + Serwist (offline/PWA), Vitest e Playwright.

## Comandos
- `npm run dev`: servidor local em http://localhost:3000
- `npm run typecheck`, `npm run lint`, `npm run build`

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
