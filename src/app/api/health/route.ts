import { NextResponse } from 'next/server';
import { SettingsDB, UsersDB, MessagesDB } from '@/lib/db';
import { encryptToken, decryptToken } from '@/lib/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Production health check, diagnostics, and environment readiness endpoint.
 */
export async function GET() {
  const startTime = Date.now();

  const diagnostics: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
    services: {},
  };

  // 1. Database Health Check
  try {
    const dbStart = Date.now();
    const users = UsersDB.getAll();
    const settings = SettingsDB.get();
    const messagesCount = MessagesDB.list().length;
    const dbLatency = Date.now() - dbStart;

    diagnostics.services.database = {
      status: 'up',
      latencyMs: dbLatency,
      usersRegistered: users.length,
      messagesTracked: messagesCount,
      workspaceName: settings.name,
    };
  } catch (dbErr: any) {
    diagnostics.status = 'degraded';
    diagnostics.services.database = {
      status: 'down',
      error: dbErr.message,
    };
  }

  // 2. Encryption Engine Self-Test (AES-256-GCM)
  try {
    const testSecret = 'passion_fruit_crypto_selftest_' + Date.now();
    const cipherText = encryptToken(testSecret);
    const decrypted = decryptToken(cipherText);

    if (decrypted === testSecret) {
      diagnostics.services.encryption = {
        status: 'up',
        algorithm: 'aes-256-gcm',
        authenticatedDecryption: 'verified',
      };
    } else {
      throw new Error('Decrypted string does not match test secret');
    }
  } catch (cryptoErr: any) {
    diagnostics.status = 'degraded';
    diagnostics.services.encryption = {
      status: 'failed',
      error: cryptoErr.message,
    };
  }

  // 3. Meta Cloud API Readiness Check
  try {
    const settings = SettingsDB.get();
    const hasWaba = Boolean(settings.wabaId && settings.wabaId.length > 3);
    const hasPhoneId = Boolean(settings.phoneNumberId && settings.phoneNumberId.length > 3);
    const hasToken = Boolean(settings.accessToken && !settings.accessToken.includes('SAMPLE_TOKEN'));
    const hasVerifyToken = Boolean(settings.verifyToken);

    diagnostics.services.meta_integration = {
      status: hasWaba && hasPhoneId && hasToken ? 'ready' : 'sandbox',
      wabaConfigured: hasWaba,
      phoneNumberConfigured: hasPhoneId,
      tokenConfigured: hasToken,
      webhookVerifyConfigured: hasVerifyToken,
      webhookUrl: settings.webhookUrl || '/api/webhook/whatsapp',
    };
  } catch (metaErr: any) {
    diagnostics.services.meta_integration = {
      status: 'error',
      error: metaErr.message,
    };
  }

  const totalDuration = Date.now() - startTime;
  diagnostics.totalLatencyMs = totalDuration;

  const httpStatus = diagnostics.status === 'healthy' ? 200 : 503;
  return NextResponse.json(diagnostics, { status: httpStatus });
}
