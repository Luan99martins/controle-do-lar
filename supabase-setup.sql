-- Execute UMA vez no Supabase SQL Editor.
-- Não apaga nem altera as tabelas perfis, categorias, movimentacoes existentes.
create table if not exists public.dados_financeiros (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.dados_financeiros enable row level security;
revoke all on public.dados_financeiros from anon;
grant select, insert, update, delete on public.dados_financeiros to authenticated;
drop policy if exists "acesso_financeiro_proprio" on public.dados_financeiros;
create policy "acesso_financeiro_proprio" on public.dados_financeiros
  for all to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
