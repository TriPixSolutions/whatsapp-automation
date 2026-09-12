// Super Admin Authentication & Session Management for Passion Fruit
export interface AdminCredentials {
  username: string;
  passwordHash: string; // stored plainly or hashed for client-side demo
  lastUpdated?: string;
}

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'passionfruit2025';

const STORAGE_KEY_CREDS = 'passionfruit_admin_creds';
const STORAGE_KEY_SESSION = 'passionfruit_admin_session';

export function getStoredAdminCredentials(): { username: string; password: string } {
  if (typeof window === 'undefined') {
    return { username: DEFAULT_ADMIN_USERNAME, password: DEFAULT_ADMIN_PASSWORD };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.username && parsed.password) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse admin credentials from localStorage', e);
  }

  return { username: DEFAULT_ADMIN_USERNAME, password: DEFAULT_ADMIN_PASSWORD };
}

export function saveAdminCredentials(username: string, password: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEY_CREDS,
    JSON.stringify({
      username: username.trim(),
      password: password.trim(),
      lastUpdated: new Date().toISOString(),
    })
  );
}

export function verifyAdminLogin(username: string, password: string): boolean {
  const current = getStoredAdminCredentials();
  const inputUser = username.trim().toLowerCase();
  const inputPass = password.trim();

  // Check against stored or default admin credentials
  if (
    (inputUser === current.username.toLowerCase() || inputUser === 'admin@passionfruit.com' || inputUser === 'pkrishal462@gmail.com') &&
    (inputPass === current.password || inputPass === DEFAULT_ADMIN_PASSWORD)
  ) {
    return true;
  }

  return false;
}

export function setAdminSession(username: string): void {
  if (typeof window === 'undefined') return;
  const session = {
    authenticated: true,
    username,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  // Also set cookie for middleware / server compatibility
  document.cookie = `pf_admin_auth=true; path=/; max-age=86400; SameSite=Lax`;
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
  document.cookie = `pf_admin_auth=; path=/; max-age=0; SameSite=Lax`;
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sessionRaw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      return session.authenticated === true;
    }
  } catch (e) {
    // fallback
  }
  return false;
}
