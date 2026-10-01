const { randomUUID } = require('crypto');

async function claimDueJobs(supabase, jobType, limit = 20) {
  const claimToken = randomUUID();
  const { data, error } = await supabase.rpc('claim_due_scheduled_jobs', {
    p_job_type: jobType, p_limit: limit, p_claim_token: claimToken,
  });
  if (error) throw new Error(`Scheduled job claim failed: ${error.message}`);
  return (data || []).map(job => ({ ...job, claim_token: claimToken }));
}

async function completeJob(supabase, job) {
  const { data, error } = await supabase.from('scheduled_jobs').update({ status: 'completed',
    executed_at: new Date().toISOString(), claimed_at: null, claim_token: null,
    last_error: null, updated_at: new Date().toISOString(),
  }).eq('id', job.id).eq('claim_token', job.claim_token).select('id');
  if (error) throw new Error(`Scheduled job completion failed: ${error.message}`);
  if (!data?.length) throw new Error('Scheduled job claim was lost before completion');
}

async function failJob(supabase, job, errorValue) {
  const terminal = Number(job.attempt_count || 0) >= Number(job.max_attempts || 3);
  const retryDelayMs = Math.min(60 * 60 * 1000, 30000 * Math.pow(2, Math.max(0, Number(job.attempt_count || 1) - 1)));
  const update = { status: terminal ? 'failed' : 'pending', claimed_at: null, claim_token: null,
    last_error: String(errorValue?.message || errorValue || 'Scheduled job failed').slice(0, 1000),
    updated_at: new Date().toISOString(),
  };
  if (!terminal) update.scheduled_at = new Date(Date.now() + retryDelayMs).toISOString();
  const { error } = await supabase.from('scheduled_jobs').update(update)
    .eq('id', job.id).eq('claim_token', job.claim_token);
  if (error) throw new Error(`Scheduled job failure update failed: ${error.message}`);
  return { terminal, retryDelayMs: terminal ? 0 : retryDelayMs };
}

module.exports = { claimDueJobs, completeJob, failJob };
