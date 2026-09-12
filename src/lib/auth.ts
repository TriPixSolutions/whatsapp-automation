// Centralized Session Token Management for Passion Fruit SaaS
// Admin access and user authorization are verified strictly via database roles.

export const AUTH_COOKIE_NAME = 'pf_auth';
export const USER_ID_COOKIE_NAME = 'pf_user_id';
export const STATUS_COOKIE_NAME = 'pf_status';
export const ROLE_COOKIE_NAME = 'pf_role';

export function setClientAuthCookies(user: { id: string; role: string; status: string; name?: string; email?: string }): void {
  if (typeof window === 'undefined') return;
  const maxAge = 604800; // 7 days
  document.cookie = `${AUTH_COOKIE_NAME}=authenticated; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${USER_ID_COOKIE_NAME}=${encodeURIComponent(user.id)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${STATUS_COOKIE_NAME}=${encodeURIComponent(user.status)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE_NAME}=${encodeURIComponent(user.role)}; path=/; max-age=${maxAge}; SameSite=Lax`;

  try {
    localStorage.setItem(
      'pf_session',
      JSON.stringify({
        userId: user.id,
        role: user.role,
        status: user.status,
        name: user.name,
        email: user.email,
        authenticated: true,
        loginAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    // ignore local storage failures
  }
}

export function clearClientAuthCookies(): void {
  if (typeof window === 'undefined') return;
  const expired = '; path=/; max-age=0; SameSite=Lax';
  document.cookie = `${AUTH_COOKIE_NAME}=${expired}`;
  document.cookie = `${USER_ID_COOKIE_NAME}=${expired}`;
  document.cookie = `${STATUS_COOKIE_NAME}=${expired}`;
  document.cookie = `${ROLE_COOKIE_NAME}=${expired}`;

  try {
    localStorage.removeItem('pf_session');
  } catch (e) {
    // ignore
  }
}

export const clearClientAuthCookie = clearClientAuthCookies;
export const setClientAuthCookie = setClientAuthCookies;

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

export function getClientSession(): { role?: string; status?: string; userId?: string } {
  if (typeof window === 'undefined') return {};
  const result: { role?: string; status?: string; userId?: string } = {};
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const [key, val] = c.trim().split('=');
    if (key === ROLE_COOKIE_NAME) result.role = decodeURIComponent(val);
    if (key === STATUS_COOKIE_NAME) result.status = decodeURIComponent(val);
    if (key === USER_ID_COOKIE_NAME) result.userId = decodeURIComponent(val);
  }
  return result;
}
