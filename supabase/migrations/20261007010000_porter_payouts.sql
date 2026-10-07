-- Porters get paid through Stripe Connect (Express accounts).
--
-- The porter-payouts edge function creates each porter's connected account
-- and its onboarding link, and records when payouts are enabled. When a job
-- is completed and its card hold captured (complete-job), the porter's share
-- (porter_payout, set by create-booking from PORTER_RATES.DRIVER_PCT) is
-- transferred to them; tips are transferred in full (add-tip). Jobs finished
-- before the porter set up payouts are paid when they do.

alter table public.profiles
  add column if not exists stripe_account_id text unique,
  add column if not exists payouts_enabled   boolean not null default false;

comment on column public.profiles.stripe_account_id is
  'Stripe Connect (Express) account the porter is paid to. Set by porter-payouts.';
comment on column public.profiles.payouts_enabled is
  'True once Stripe allows transfers to the porter''s account. Set by porter-payouts.';

alter table public.service_requests
  add column if not exists porter_payout      numeric,
  add column if not exists payout_transfer_id text unique,
  add column if not exists tip_transfer_id    text unique;

comment on column public.service_requests.porter_payout is
  'What the porter earns for the job, before tips. Set by create-booking.';
comment on column public.service_requests.payout_transfer_id is
  'Stripe transfer of porter_payout to the porter. Null until paid.';
comment on column public.service_requests.tip_transfer_id is
  'Stripe transfer of the tip to the porter. Null until paid.';

-- Users can't set their own payout account or mark it enabled.
create or replace function public.guard_profile_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_api_role() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- New accounts start unverified; only ops (service role) can approve.
    new.verification_status := 'pending';
    new.stripe_customer_id  := null;
    new.stripe_account_id   := null;
    new.payouts_enabled     := false;
    new.is_active           := true;
    return new;
  end if;

  if new.id                  is distinct from old.id
  or new.user_type           is distinct from old.user_type
  or new.verification_status is distinct from old.verification_status
  or new.stripe_customer_id  is distinct from old.stripe_customer_id
  or new.stripe_account_id   is distinct from old.stripe_account_id
  or new.payouts_enabled     is distinct from old.payouts_enabled
  or new.is_active           is distinct from old.is_active
  or new.created_at          is distinct from old.created_at then
    raise exception 'These profile fields can only be changed by Porter staff'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
