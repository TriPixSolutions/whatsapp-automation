// Compatibility layer redirecting to standard session & cookie management
import { clearClientAuthCookies } from './auth';

export function clearAdminSession(): void {
  clearClientAuthCookies();
  if (typeof window !== 'undefined') {
    document.cookie = `pf_admin_auth=; path=/; max-age=0; SameSite=Lax`;
    try {
      localStorage.removeItem('passionfruit_admin_session');
    } catch {}
  }
}
