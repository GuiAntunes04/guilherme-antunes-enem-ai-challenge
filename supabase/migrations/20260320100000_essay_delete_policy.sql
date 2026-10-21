drop policy if exists "Users can delete own essays" on public.essays;

create policy "Users can delete own essays"
  on public.essays for delete
  using (auth.uid() = user_id);