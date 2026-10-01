const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const net = require('node:net');

(async () => {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) throw new Error('Local server exited before readiness');
      try { ready = (await fetch(`${base}/auth/login`)).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'Local server starts');
    for (const path of ['/api/automations', '/api/test-center/send-test', '/api/settings']) {
      const response = await fetch(`${base}${path}`, { headers: { cookie: 'pf_auth=authenticated; pf_role=super_admin; pf_status=approved' } });
      assert.equal(response.status, 401, `${path} rejects forged compatibility cookies`);
    }
    const impersonation = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'google', email: 'not-a-real-user@example.test' }) });
    assert.equal(impersonation.status, 400);
    assert.equal(impersonation.headers.get('set-cookie'), null);
    const oauth = await fetch(`${base}/api/auth/google/callback?code=invalid`);
    assert.equal(oauth.status, 400);
    const runner = await fetch(`${base}/api/internal/workflow-delays`, { method: 'POST' });
    assert.equal(runner.status, 401, 'worker endpoint rejects missing credentials');
    const logout = await fetch(`${base}/api/auth/logout`, { method: 'POST' });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /pf_session_token=;/);
    console.log('Built-server smoke: login page, 3 protected APIs, Google impersonation, OAuth state, worker endpoint authentication, and logout passed.');
  } finally {
    child.kill('SIGTERM');
    await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve); });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
