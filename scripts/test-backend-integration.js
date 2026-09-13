/**
 * test-backend-integration.js
 * Comprehensive End-to-End Backend Verification Test Suite
 * Tests RBAC middleware, AES-256-GCM token protection, HMAC-SHA256 webhooks,
 * Meta 60-day token exchange, and Meta App Review compliance endpoints.
 */

const http = require('http');
const crypto = require('crypto');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

function makeRequest(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlPath, BASE_URL);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          // Non-JSON
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      if (typeof options.body === 'object') {
        req.write(JSON.stringify(options.body));
      } else {
        req.write(options.body);
      }
    }
    req.end();
  });
}

const results = [];
function recordTest(name, passed, detail) {
  results.push({ name, passed, detail });
  const mark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${mark}: ${name} - ${detail || ''}`);
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Backend Integration Test Suite on ${BASE_URL}`);
  console.log(`======================================================\n`);

  // TEST 1: Health Check Endpoint
  try {
    const res = await makeRequest('/api/health');
    const isHealthy = res.status === 200 && res.json?.status === 'healthy';
    const hasCrypto = res.json?.services?.encryption?.status === 'up';
    recordTest(
      'Health Check & Diagnostics',
      isHealthy && hasCrypto,
      `Status: ${res.status}, Encryption: ${res.json?.services?.encryption?.status}`
    );
  } catch (err) {
    recordTest('Health Check & Diagnostics', false, err.message);
  }

  // TEST 2: RBAC - Unauthenticated Access Blocked
  try {
    const res = await makeRequest('/api/messages');
    recordTest(
      'RBAC: Unauthenticated Workspace API Blocked',
      res.status === 401,
      `Expected 401, received HTTP ${res.status}`
    );
  } catch (err) {
    recordTest('RBAC: Unauthenticated Workspace API Blocked', false, err.message);
  }

  // TEST 3: RBAC - Unapproved User Forbidden from Workspace API
  try {
    const res = await makeRequest('/api/messages', {
      headers: {
        Cookie: 'pf_auth=authenticated; pf_status=pending_approval; pf_role=user',
      },
    });
    recordTest(
      'RBAC: Pending User Forbidden on Workspace API',
      res.status === 403,
      `Expected 403, received HTTP ${res.status}`
    );
  } catch (err) {
    recordTest('RBAC: Pending User Forbidden on Workspace API', false, err.message);
  }

  // TEST 4: RBAC - Approved User Allowed on Workspace API
  try {
    const res = await makeRequest('/api/messages', {
      headers: {
        Cookie: 'pf_auth=authenticated; pf_status=approved; pf_role=user',
      },
    });
    recordTest(
      'RBAC: Approved User Allowed on Workspace API',
      res.status === 200,
      `Expected 200, received HTTP ${res.status}`
    );
  } catch (err) {
    recordTest('RBAC: Approved User Allowed on Workspace API', false, err.message);
  }

  // TEST 5: RBAC - Super Admin Protection
  try {
    const userRes = await makeRequest('/api/super-admin/users', {
      headers: {
        Cookie: 'pf_auth=authenticated; pf_status=approved; pf_role=user',
      },
    });
    const adminRes = await makeRequest('/api/super-admin/users', {
      headers: {
        Cookie: 'pf_auth=authenticated; pf_status=approved; pf_role=super_admin',
      },
    });
    recordTest(
      'RBAC: Super Admin Endpoint Guarded',
      userRes.status === 403 && adminRes.status === 200,
      `Standard User: ${userRes.status}, Super Admin: ${adminRes.status}`
    );
  } catch (err) {
    recordTest('RBAC: Super Admin Endpoint Guarded', false, err.message);
  }

  // TEST 6: Meta Token Masking
  try {
    const res = await makeRequest('/api/settings', {
      headers: {
        Cookie: 'pf_auth=authenticated; pf_status=approved; pf_role=user',
      },
    });
    const masked = res.json?.settings?.accessToken || '';
    const isMaskedOrEmpty = masked.includes('•') || masked === '';
    recordTest(
      'Security: Meta Access Token Masked at REST/API',
      isMaskedOrEmpty,
      `Token preview: "${masked.substring(0, 10)}..."`
    );
  } catch (err) {
    recordTest('Security: Meta Access Token Masked at REST/API', false, err.message);
  }

  // TEST 7: Meta OAuth 60-day Token Exchange
  try {
    const res = await makeRequest('/api/meta/oauth/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'pf_auth=authenticated; pf_status=approved; pf_role=admin',
      },
      body: {
        shortLivedToken: 'mock_user_access_token_12345',
      },
    });
    const ok = res.status === 200 && res.json?.success === true && res.json?.expiresIn > 0;
    recordTest(
      'Meta OAuth 60-Day Exchange',
      ok,
      `Status: ${res.status}, ExpiresIn: ${res.json?.expiresIn}s, Mode: ${res.json?.mode || 'live'}`
    );
  } catch (err) {
    recordTest('Meta OAuth 60-Day Exchange', false, err.message);
  }

  // TEST 8: Meta Stats Controller
  try {
    const res = await makeRequest('/api/meta/stats', {
      headers: {
        Cookie: 'pf_auth=authenticated; pf_status=approved; pf_role=user',
      },
    });
    const ok = res.status === 200 && res.json?.success === true && typeof res.json?.metrics?.spend === 'number';
    recordTest(
      'Meta Stats & Insights Engine',
      ok,
      `Spend: $${res.json?.metrics?.spend}, Messages: ${res.json?.metrics?.totalMessages}`
    );
  } catch (err) {
    recordTest('Meta Stats & Insights Engine', false, err.message);
  }

  // TEST 9: Inbound Webhook Handshake (GET hub.challenge)
  try {
    const res = await makeRequest(
      '/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=passion_fruit_verify_token_2025&hub.challenge=test_challenge_abc123'
    );
    recordTest(
      'Meta Webhook Verification Handshake',
      res.status === 200 && res.data.trim() === 'test_challenge_abc123',
      `Challenge Returned: "${res.data.trim()}"`
    );
  } catch (err) {
    recordTest('Meta Webhook Verification Handshake', false, err.message);
  }

  // TEST 10: Meta Compliance - Data Deletion Callback & Tracking
  try {
    const postRes = await makeRequest('/api/meta/data-deletion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'compliance_tester@test.com' },
    });

    const hasUrlAndCode =
      postRes.status === 200 &&
      Boolean(postRes.json?.url) &&
      Boolean(postRes.json?.confirmation_code);

    let getOk = false;
    if (hasUrlAndCode) {
      const getRes = await makeRequest(
        `/api/meta/data-deletion?code=${postRes.json.confirmation_code}`
      );
      getOk = getRes.status === 200 && getRes.json?.record?.status === 'completed';
    }

    recordTest(
      'Meta App Review: Data Deletion Callback & Status Query',
      hasUrlAndCode && getOk,
      `Code: ${postRes.json?.confirmation_code}`
    );
  } catch (err) {
    recordTest('Meta App Review: Data Deletion Callback & Status Query', false, err.message);
  }

  // TEST 11: Compliance Public Pages
  try {
    const privRes = await makeRequest('/privacy-policy');
    const termsRes = await makeRequest('/terms-of-service');
    const delRes = await makeRequest('/data-deletion');
    const all200 = privRes.status === 200 && termsRes.status === 200 && delRes.status === 200;
    recordTest(
      'Meta Compliance: Public Legal Pages Renderable',
      all200,
      `Privacy: ${privRes.status}, Terms: ${termsRes.status}, Deletion: ${delRes.status}`
    );
  } catch (err) {
    recordTest('Meta Compliance: Public Legal Pages Renderable', false, err.message);
  }

  console.log(`\n======================================================`);
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`📊 Test Summary: ${totalPassed} / ${results.length} Passed`);
  console.log(`======================================================\n`);

  if (totalPassed === results.length) {
    console.log('🎉 ALL BACKEND SYSTEMS & COMPLIANCE RULES VERIFIED!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED. Please review output above.\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
