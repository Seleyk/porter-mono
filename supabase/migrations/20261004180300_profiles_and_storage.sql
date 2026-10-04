-- Let the two people on a job see each other's profile (name, photo, vehicle),
-- and add storage for proof-of-delivery photos and avatars.

-- ─── Counterpart profiles ────────────────────────────────────────────────────

create policy "Job counterparts can view each other" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.service_requests r
      where r.status <> 'cancelled'
        and (
          (r.customer_id = auth.uid() and r.porter_id = profiles.id)
          or (r.porter_id = auth.uid() and r.customer_id = profiles.id)
        )
    )
  );

-- ─── Storage buckets ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('proof-of-delivery', 'proof-of-delivery', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  ('avatars',           'avatars',           true,  5242880,  array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

-- proof-of-delivery: objects live at "<service_request_id>/<file>".
-- The assigned porter uploads while the job is in progress; both sides can view.
create policy "Porter uploads proof for their job" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proof-of-delivery'
    and exists (
      select 1 from public.service_requests r
      where r.id::text = (storage.foldername(name))[1]
        and r.porter_id = auth.uid()
        and r.status in ('accepted', 'picked_up')
    )
  );

create policy "Job participants view proof" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proof-of-delivery'
    and exists (
      select 1 from public.service_requests r
      where r.id::text = (storage.foldername(name))[1]
        and (r.customer_id = auth.uid() or r.porter_id = auth.uid())
    )
  );

-- avatars: public read (bucket is public); users write only "<their uid>/<file>".
create policy "Users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
