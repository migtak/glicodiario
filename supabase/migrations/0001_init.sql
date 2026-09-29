-- GlicoDiário — estrutura inicial do banco (PROJETO.md §8)
-- Como aplicar: Supabase → SQL Editor → New query → colar este arquivo → Run.

-- =========================================================
-- Tipos
-- =========================================================
create type public.contexto_medicao as enum (
  'jejum',
  'antes_refeicao',
  'pos_1h',
  'pos_2h',
  'antes_dormir',
  'aleatorio'
);

-- =========================================================
-- Tabelas
-- IDs uuid com default, mas o app pode enviar o próprio id
-- (necessário para registros criados offline — Fase 9).
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text check (char_length(nome) <= 100),
  aviso_aceito_em timestamptz,
  criado_em timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao text not null check (char_length(descricao) between 1 and 500),
  ocorreu_em timestamptz not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.glucose_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  valor_mg_dl smallint not null check (valor_mg_dl between 20 and 600),
  contexto public.contexto_medicao not null,
  medido_em timestamptz not null,
  observacao text check (char_length(observacao) <= 500),
  meal_id uuid references public.meals (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (char_length(tipo) between 1 and 100),
  duracao_min smallint not null check (duracao_min between 1 and 1440),
  ocorreu_em timestamptz not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  peso_kg numeric(5, 2) not null check (peso_kg between 20 and 400),
  medido_em timestamptz not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Só guarda as faixas que o usuário personalizou; os padrões ficam no código.
-- normal: normal_min..normal_max · atenção: normal_max+1..atencao_max · alto: > atencao_max
create table public.target_ranges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contexto public.contexto_medicao not null,
  normal_min smallint not null check (normal_min between 20 and 600),
  normal_max smallint not null check (normal_max between 20 and 600),
  atencao_max smallint not null check (atencao_max between 20 and 600),
  atualizado_em timestamptz not null default now(),
  unique (user_id, contexto),
  check (normal_min < normal_max and normal_max < atencao_max)
);

create index glucose_readings_user_medido_idx on public.glucose_readings (user_id, medido_em desc);
create index meals_user_ocorreu_idx on public.meals (user_id, ocorreu_em desc);
create index activities_user_ocorreu_idx on public.activities (user_id, ocorreu_em desc);
create index weights_user_medido_idx on public.weights (user_id, medido_em desc);

-- =========================================================
-- atualizado_em automático
-- =========================================================
create function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger set_atualizado_em before update on public.glucose_readings
  for each row execute function public.set_atualizado_em();
create trigger set_atualizado_em before update on public.meals
  for each row execute function public.set_atualizado_em();
create trigger set_atualizado_em before update on public.activities
  for each row execute function public.set_atualizado_em();
create trigger set_atualizado_em before update on public.weights
  for each row execute function public.set_atualizado_em();
create trigger set_atualizado_em before update on public.target_ranges
  for each row execute function public.set_atualizado_em();

-- =========================================================
-- Segurança: cada usuário só enxerga e altera os próprios dados (RLS)
-- =========================================================
alter table public.profiles enable row level security;
alter table public.glucose_readings enable row level security;
alter table public.meals enable row level security;
alter table public.activities enable row level security;
alter table public.weights enable row level security;
alter table public.target_ranges enable row level security;

create policy "perfil: ler o próprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "perfil: alterar o próprio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "glicemia: somente o dono" on public.glucose_readings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "refeições: somente o dono" on public.meals
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "atividades: somente o dono" on public.activities
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "peso: somente o dono" on public.weights
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "faixas: somente o dono" on public.target_ranges
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Permissões explícitas: visitantes não logados (anon) não acessam nada.
revoke all on public.profiles, public.glucose_readings, public.meals, public.activities,
  public.weights, public.target_ranges from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.glucose_readings, public.meals, public.activities,
  public.weights, public.target_ranges to authenticated;
grant usage on type public.contexto_medicao to authenticated;

-- =========================================================
-- Cria o perfil automaticamente no cadastro
-- (nome e aceite do aviso vêm dos metadados enviados pelo app)
-- =========================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, aviso_aceito_em)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
    case when (new.raw_user_meta_data ->> 'aviso_aceito')::boolean then now() end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Exclusão da própria conta e de todos os dados (LGPD)
-- As tabelas usam "on delete cascade", então apagar o usuário apaga tudo.
-- =========================================================
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
