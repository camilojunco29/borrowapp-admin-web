import axios from "axios";
import { getSessionToken, getTokenExpiry, expireSession } from "./session.js";

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env?.VITE_API_URL),
  timeout: 70000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function normalizeBaseUrl(value = "https://borrowapp.onrender.com") {
  const root = (value || "https://borrowapp.onrender.com").trim().replace(/\/+$/, "");
  const url = new URL(root);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("La URL de API debe usar HTTPS (HTTP solo se permite en localhost), sin credenciales ni parámetros.");
  }
  return root.endsWith("/api/v1") ? root : `${root}/api/v1`;
}

export function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg || "Dato inválido").join(". ");
  if (!error.response && error.isAxiosError) return "No se pudo conectar con la API. Si Render está iniciando, espera un minuto y vuelve a intentar.";
  return error.message || "No se pudo completar la operación.";
}

api.interceptors.request.use((config) => {
  const token = config.url === "/auth/login" ? null : getSessionToken();
  const expires = token && getTokenExpiry(token);
  if (expires && expires <= Date.now()) {
    expireSession(token);
    throw new Error("Tu sesión venció. Vuelve a iniciar sesión.");
  }
  config.sessionToken = token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.sessionToken) {
      expireSession(error.config.sessionToken);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (correo, contrasena) =>
    api.post("/auth/login", { correo: correo.trim().toLowerCase(), contrasena }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const adminService = {
  getMembers: (orgId) =>
    api.get(`/organizations/${orgId}/members`).then((r) => r.data),
  updateCentralPoint: (orgId, punto_central) =>
    api
      .patch(`/organizations/${orgId}/central-point`, { punto_central })
      .then((r) => r.data),
  getReports: (orgId) =>
    api.get(`/organizations/${orgId}/reports`).then((r) => r.data),
  resolveReport: (reportId, payload) =>
    api.post(`/reports/${reportId}/resolve`, payload).then((r) => r.data),
  revertSanction: (orgId, userId) =>
    api
      .post(`/organizations/${orgId}/members/${userId}/revert-sanction`)
      .then((r) => r.data),
  getNeeds: (orgId) =>
    api.get(`/organizations/${orgId}/needs`).then((r) => r.data),
  getNeedOffers: (needId) =>
    api.get(`/needs/${needId}/offers`).then((r) => r.data),
  getLoans: (orgId) =>
    api.get(`/organizations/${orgId}/loans`).then((r) => r.data),
};

export default api;
