# GlicoDiário

Aplicativo web para acompanhar a glicemia no dia a dia, pensado para quem tem pré-diabetes ou quer entender melhor os próprios valores. Funciona no computador e no celular, pode ser instalado como app (PWA) e continua registrando sem internet.

> **Aviso:** o GlicoDiário é informativo e educativo. Não é dispositivo médico, não faz diagnóstico e não substitui orientação de um profissional de saúde.

## O que faz

- Registro de glicemia (mg/dL) com o momento da medição: jejum, antes ou depois das refeições, antes de dormir…
- Classificação por faixas de referência (SBD/ADA), editáveis, com alertas para valores de risco
- Registro de refeições, atividade física e peso, com vínculo entre a refeição e a medição pós-refeição
- Histórico, gráficos, resumo do período e relatório para imprimir ou salvar em PDF e levar ao médico
- Exportação dos dados em CSV e exclusão da conta (LGPD)
- Modo offline: registros feitos sem internet são enviados sozinhos quando a conexão volta

Os requisitos completos estão em [`PROJETO.md`](PROJETO.md).

## Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase (Auth, Postgres com RLS) · Dexie (IndexedDB) · Vitest · Playwright

## Rodando localmente

1. Crie um projeto no [Supabase](https://supabase.com) e rode `supabase/migrations/0001_init.sql` no SQL Editor.
2. Copie `.env.example` para `.env.local` e preencha a URL e a *publishable key* do projeto.
3. Instale e rode o servidor:

   ```bash
   npm install
   npm run dev
   ```

4. Abra http://localhost:3000.

## Testes

```bash
npm test          # regras (Vitest)
npm run e2e       # navegador (Playwright); precisa de E2E_EMAIL e E2E_PASSWORD no .env.local
```
