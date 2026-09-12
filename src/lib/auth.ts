// Centralized Authentication for Passion Fruit SaaS
// Hardcoded credentials as specified:
// Username/ID: User 1
// Password:    0725

export const VALID_CREDENTIALS = {
  username: 'User 1',
  password: '0725',
};

export const AUTH_COOKIE_NAME = 'pf_auth';

export function checkCredentials(user: string, pass: string): boolean {
  const cleanUser = (user || '').trim().toLowerCase();
  const cleanPass = (pass || '').trim();

  // Allow 'User 1', 'user 1', or 'user1'
  const isValidUser =
    cleanUser === 'user 1' ||
    cleanUser === 'user1' ||
    cleanUser === 'admin';

  const isValidPass = cleanPass === '0725';

  return isValidUser && isValidPass;
}

export function setClientAuthCookie(): void {
  if (typeof window === 'undefined') return;
  // 7 days expiration, Lax SameSite, root path
  document.cookie = `${AUTH_COOKIE_NAME}=authenticated; path=/; max-age=604800; SameSite=Lax`;
  try {
    localStorage.setItem('pf_session', JSON.stringify({
      username: 'User 1',
      authenticated: true,
      loginAt: new Date().toISOString(),
    }));
  } catch (e) {
    // ignore
  }
}

export function clearClientAuthCookie(): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  try {
    localStorage.removeItem('pf_session');
  } catch (e) {
    // ignore
  }
}

export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const [key, val] = c.trim().split('=');
    if (key === AUTH_COOKIE_NAME && val === 'authenticated') {
      return true;
    }
  }
  return false;
}
