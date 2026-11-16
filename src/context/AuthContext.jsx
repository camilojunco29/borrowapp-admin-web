import { createContext, useContext, useEffect, useState } from "react";
import { authService, getErrorMessage } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminMemberships, setAdminMemberships] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const hydrateSession = (data) => {
    const u = data.usuario || data;
    const allMemberships = data.membresias || [];
    const onlyAdmin = allMemberships.filter(
      (m) => m.rol === "ADMINISTRADOR" && m.organizacion
    );

    setUser(u);
    setAdminMemberships(onlyAdmin);

    const savedOrgId = Number(localStorage.getItem("borrowapp_active_org_id"));
    const found = onlyAdmin.find((m) => Number(m.organizacion_id) === savedOrgId);
    const selected = found ? found.organizacion : onlyAdmin[0]?.organizacion || null;

    setActiveOrg(selected);
    if (selected) {
      localStorage.setItem("borrowapp_active_org_id", String(selected.id));
    }
  };

  const restoreSession = async () => {
    const token = localStorage.getItem("borrowapp_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setSessionError("");
    try {
      hydrateSession(await authService.me());
    } catch (error) {
      if (error.response?.status !== 401) setSessionError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
    const expired = () => {
      setUser(null);
      setAdminMemberships([]);
      setActiveOrg(null);
      setSessionError("");
      localStorage.removeItem("borrowapp_active_org_id");
    };
    window.addEventListener("borrowapp:session-expired", expired);
    return () => window.removeEventListener("borrowapp:session-expired", expired);
  }, []);

  const login = async (correo, contrasena) => {
    const data = await authService.login(correo, contrasena);
    const onlyAdmin = (data.membresias || []).filter(
      (m) => m.rol === "ADMINISTRADOR" && m.organizacion
    );
    if (onlyAdmin.length === 0) {
      throw new Error(
        "Tu cuenta no administra ninguna organización. Crea una comunidad desde la app móvil primero."
      );
    }
    const token = data.access_token || data.token;
    if (!token) throw new Error("La API no devolvió un token de sesión.");
    localStorage.setItem("borrowapp_admin_token", token);
    setSessionError("");
    hydrateSession(data);
  };

  const logout = () => {
    setSessionError("");
    localStorage.removeItem("borrowapp_admin_token");
    localStorage.removeItem("borrowapp_active_org_id");
    setUser(null);
    setAdminMemberships([]);
    setActiveOrg(null);
  };

  const selectOrganization = (org) => {
    setActiveOrg(org);
    localStorage.setItem("borrowapp_active_org_id", String(org.id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminMemberships,
        activeOrg,
        setActiveOrg: selectOrganization,
        login,
        logout,
        loading,
        sessionError,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
