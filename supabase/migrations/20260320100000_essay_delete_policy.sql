create policy "Users can delete own essays"
  on public.essays for delete
  using (auth.uid() = user_id);
