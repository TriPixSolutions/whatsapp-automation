-- Deployment template only. Do not run with a placeholder secret.
-- Requires pg_cron + pg_net to be available in this project's database.
-- Keep the real WORKER_SECRET out of Git and ordinary logs.
-- This schedules workflow delays only; BullMQ campaigns still require Redis/worker.
-- Replace the HTTPS origin and WORKER_SECRET directly in the database dashboard.
SELECT cron.schedule(
  'whatsapp-workflow-delays',
  '* * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://lightcoral-owl-812884.hostingersite.com/api/internal/workflow-delays',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer REPLACE_WITH_WORKER_SECRET'),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $job$
);
-- Inspect cron.job_run_details and net._http_response before accepting delay delivery.
-- Never mark successful scheduling as proof that the HTTP action succeeded.
