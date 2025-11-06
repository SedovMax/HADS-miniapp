-- Schema and policies for the HADS mini app
create extension if not exists "pgcrypto";

create table if not exists public.hads_results (
  id uuid primary key default gen_random_uuid(),
  user_id bigint,
  submitted_at timestamptz not null,
  anxiety_score smallint not null,
  depression_score smallint not null,
  raw_answers jsonb not null,
  inserted_at timestamptz not null default timezone('utc', now())
);

alter table public.hads_results enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hads_results'
      and policyname = 'Allow anonymous inserts'
  ) then
    create policy "Allow anonymous inserts"
      on public.hads_results for insert
      with check (auth.role() = 'anon');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hads_results'
      and policyname = 'Allow anonymous selects'
  ) then
    create policy "Allow anonymous selects"
      on public.hads_results for select
      using (auth.role() = 'anon');
  end if;
end $$;

create index if not exists hads_results_user_id_idx
  on public.hads_results(user_id);

create index if not exists hads_results_submitted_at_idx
  on public.hads_results(submitted_at);
