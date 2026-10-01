// The web process owns workflow state; the worker only requests a due-session scan.
function createDelayPoller({ fetchImpl = fetch, env = process.env } = {}) {
  let running = false;
  return async function poll() {
    if (running) return { skipped: true };
    if (!env.WORKER_SECRET || env.WORKER_SECRET.length < 32) throw new Error('WORKER_SECRET is not configured');
    running = true;
    try {
      const response = await fetchImpl(env.WORKFLOW_RUNNER_URL || `http://127.0.0.1:${env.PORT || 3000}/api/internal/workflow-delays`, {
        method: 'POST', headers: { authorization: `Bearer ${env.WORKER_SECRET}` },
        signal: AbortSignal.timeout(60000), redirect: 'error',
      });
      if (!response.ok) throw new Error(`Delay runner HTTP ${response.status}`);
      const result = await response.json();
      if (result.failed) throw new Error(`Delay runner reported ${result.failed} failed sessions`);
      return result;
    } finally { running = false; }
  };
}
module.exports = { createDelayPoller };
