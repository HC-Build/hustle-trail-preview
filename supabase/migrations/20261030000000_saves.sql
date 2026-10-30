create table if not exists public.saves (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  state jsonb,
  best jsonb,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
grant select, insert, update on public.saves to authenticated;
revoke all on public.saves from anon;
create policy "own save select" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "own save insert" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own save update" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
