import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authService, getErrorMessage } from "../api/client";
import {
  getSessionToken, saveSessionToken, clearSession, removeLegacySession,
  getSavedOrganizationId, saveOrganizationId, getTokenExpiry, expireSession,
  SESSION_EXPIRED_EVENT,
} from "../api/session.js";
import { adminMembershipsFrom, mergeOrganization } from "../utils/organizations.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminMemberships, setAdminMemberships] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const operation = useRef(0);

  const hydrateSession = (data) => {
    const account = data.usuario || data;
    if (!account?.id) throw new Error("La API no devolvió un perfil de usuario válido.");
    const memberships = adminMembershipsFrom(data);
    const savedId = getSavedOrganizationId();
    const selected = (memberships.find((m) => Number(m.organizacion_id) === savedId) || memberships[0])?.organizacion || null;
    setUser(account);
    setAdminMemberships(memberships);
    setActiveOrg(selected);
    saveOrganizationId(selected?.id);
  };

  const resetSession = () => {
    operation.current += 1;
    clearSession();
    setUser(null);
    setAdminMemberships([]);
    setActiveOrg(null);
    setSessionError("");
    setLoading(false);
  };

  const restoreSession = async () => {
    const revision = ++operation.current;
    const token = getSessionToken();
    if (!token) { resetSession(); return; }
    setLoading(true);
    setSessionError("");
    try {
      const data = await authService.me();
      if (revision === operation.current && token === getSessionToken()) hydrateSession(data);
    } catch (error) {
      if (revision === operation.current && error.response?.status !== 401) setSessionError(getErrorMessage(error));
    } finally {
      if (revision === operation.current) setLoading(false);
    }
  };

  useEffect(() => {
    removeLegacySession();
    window.addEventListener(SESSION_EXPIRED_EVENT, resetSession);
    restoreSession();
    return () => {
      operation.current += 1;
      window.removeEventListener(SESSION_EXPIRED_EVENT, resetSession);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = getSessionToken();
    const expires = token && getTokenExpiry(token);
    if (!expires) return;
    const check = () => { if (Date.now() >= expires) expireSession(token); };
    const timer = window.setTimeout(check, Math.min(Math.max(expires - Date.now() + 1, 0), 2147483647));
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [user]);

  const login = async (correo, contrasena) => {
    const revision = ++operation.current;
    const data = await authService.login(correo, contrasena);
    if (revision !== operation.current) return;
    if (!adminMembershipsFrom(data).length) throw new Error("Tu cuenta no administra ninguna organización. Crea una comunidad desde la app móvil primero.");
    if (!data.usuario?.id) throw new Error("La API no devolvió un perfil de usuario válido.");
    saveSessionToken(data.access_token || data.token);
    setSessionError("");
    hydrateSession(data);
  };

  const selectOrganization = (org) => {
    const membership = adminMemberships.find((m) => Number(m.organizacion_id) === Number(org?.id));
    if (!membership) return;
    setActiveOrg(membership.organizacion);
    saveOrganizationId(membership.organizacion_id);
  };

  const updateOrganization = (org) => {
    setAdminMemberships((memberships) => mergeOrganization(memberships, org));
    setActiveOrg((current) => Number(current?.id) === Number(org.id) ? { ...current, ...org } : current);
  };

  return <AuthContext.Provider value={{ user, adminMemberships, activeOrg, setActiveOrg: selectOrganization, updateOrganization, login, logout: resetSession, loading, sessionError, restoreSession }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
