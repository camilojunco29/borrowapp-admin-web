const TOKEN_KEY = "borrowapp_admin_token";
const ORG_KEY = "borrowapp_active_org_id";
export const SESSION_EXPIRED_EVENT = "borrowapp:session-expired";

export function getSessionToken() {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function saveSessionToken(token) {
  if (typeof token !== "string" || !token.trim()) throw new Error("La API no devolvió un token de sesión válido.");
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    throw new Error("El navegador no permite guardar la sesión de esta pestaña. Revisa su configuración de almacenamiento.");
  }
  removeLegacySession();
}

export function removeLegacySession() {
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(ORG_KEY); } catch { /* Storage can be disabled. */ }
}

export function clearSession() {
  try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(ORG_KEY); } catch { /* Already unavailable. */ }
  removeLegacySession();
}

export function getSavedOrganizationId() {
  try { return Number(sessionStorage.getItem(ORG_KEY)) || null; } catch { return null; }
}

export function saveOrganizationId(id) {
  try {
    if (id == null) sessionStorage.removeItem(ORG_KEY);
    else sessionStorage.setItem(ORG_KEY, String(id));
  } catch { /* The selection still works in memory. */ }
}

// Only schedules UI expiration; the API must still validate the JWT signature.
export function getTokenExpiry(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const exp = JSON.parse(atob(payload)).exp;
    return typeof exp === "number" && Number.isFinite(exp) && exp > 0 ? exp * 1000 : null;
  } catch { return null; }
}

export function expireSession(expectedToken) {
  if (expectedToken && expectedToken !== getSessionToken()) return;
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
