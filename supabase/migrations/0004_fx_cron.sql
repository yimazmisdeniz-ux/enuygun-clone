-- Schedule fx-refresh to keep TRY rates fresh forever, without ever touching an
-- external FX API at request time. Runs every 6 hours (4 calls/day) — far below
-- any keyless-source limit, so it can run indefinitely.
--
-- The bearer token is read from Supabase Vault (secret name 'fx_cron_bearer'),
-- never inlined here. Create it once (outside version control) with:
--   select vault.create_secret('<ANON_OR_SERVICE_JWT>', 'fx_cron_bearer');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Recreate idempotently.
select cron.unschedule('fx-refresh') where exists (
  select 1 from cron.job where jobname = 'fx-refresh'
);

select cron.schedule(
  'fx-refresh',
  '0 */6 * * *',
  $$
  select net.http_post(
    url     := 'https://xcrzytqktkkwessrqccz.supabase.co/functions/v1/fx-refresh',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'fx_cron_bearer'
      )
    ),
    body    := '{}'::jsonb
  );
  $$
);
