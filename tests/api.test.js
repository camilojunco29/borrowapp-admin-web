import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import api, { authService, adminService, normalizeBaseUrl, getErrorMessage } from "../src/api/client.js";

const values = new Map();
globalThis.sessionStorage = {
  getItem: (key) => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
globalThis.localStorage = { removeItem() {} };
const events = [];
globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
const schema = JSON.parse(fs.readFileSync(new URL("../api-openapi.json", import.meta.url)));

test("normaliza raíz y prefijo sin duplicar /api/v1", () => {
  assert.equal(normalizeBaseUrl("https://borrowapp.onrender.com/"), api.defaults.baseURL);
  assert.equal(normalizeBaseUrl(" https://borrowapp.onrender.com/api/v1/ "), api.defaults.baseURL);
  assert.equal(api.defaults.timeout, 70000);
});

test("todas las operaciones del panel coinciden con OpenAPI publicado", async () => {
  values.set("borrowapp_admin_token", "test-token");
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
  };
  await authService.login(" ADMIN@EXAMPLE.COM ", "password");
  await authService.me();
  await adminService.getMembers(12);
  await adminService.getReports(12);
  await adminService.getNeeds(12);
  await adminService.getLoans(12);
  await adminService.getNeedOffers(31);
  await adminService.updateCentralPoint(12, "Biblioteca");
  await adminService.resolveReport(55, { sancion: "ADVERTENCIA", nota_resolucion: "Revisado" });
  await adminService.revertSanction(12, 88);
  for (const [index, config] of requests.entries()) {
    const path = Object.keys(schema.paths).find((path) =>
      new RegExp(`^${path.replace(/\{[^}]+\}/g, "[^/]+")}$`).test(`/api/v1${config.url}`));
    assert.ok(path && schema.paths[path][config.method], `${config.method} ${config.url}`);
    assert.equal(config.headers.Authorization, index === 0 ? undefined : "Bearer test-token");
  }
  assert.deepEqual(JSON.parse(requests[0].data), { correo: "admin@example.com", contrasena: "password" });
  assert.equal(requests.at(-1).url, "/organizations/12/members/88/revert-sanction");
});

test("401 de login conserva el formulario; 401 protegido expira la sesión", async () => {
  api.defaults.adapter = async (config) => { throw { response: { status: 401 }, config }; };
  await assert.rejects(authService.login("bad@example.com", "bad"));
  assert.equal(values.get("borrowapp_admin_token"), "test-token");
  assert.equal(events.length, 0);
  await assert.rejects(authService.me());
  assert.equal(values.has("borrowapp_admin_token"), false);
  assert.deepEqual(events, ["borrowapp:session-expired"]);
});

test("errores FastAPI y fallos de red producen texto renderizable", () => {
  assert.equal(getErrorMessage({ response: { data: { detail: [{ msg: "Fecha inválida" }] } } }), "Fecha inválida");
  assert.equal(getErrorMessage({ response: { data: { detail: "Sin permisos" } } }), "Sin permisos");
  assert.match(getErrorMessage({ isAxiosError: true }), /Render/);
});

test("rechaza API remota sin HTTPS y credenciales embebidas", () => {
  for (const url of ["http://api.example.com", "https://user:secret@api.example.com", "https://api.example.com?token=test", "ftp://localhost"]) {
    assert.throws(() => normalizeBaseUrl(url));
  }
  assert.equal(normalizeBaseUrl("http://localhost:8000"), "http://localhost:8000/api/v1");
});

test("un token vencido no llega a enviarse a la API", async () => {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 5 })).toString("base64url");
  values.set("borrowapp_admin_token", `test.${payload}.signature`);
  let called = false;
  api.defaults.adapter = async () => { called = true; };
  await assert.rejects(authService.me(), /sesión venció/);
  assert.equal(called, false);
  assert.equal(values.has("borrowapp_admin_token"), false);
});

test("un 401 tardío de la sesión anterior no cierra la nueva", async () => {
  values.set("borrowapp_admin_token", "old-token");
  let rejectRequest;
  let ready;
  const started = new Promise((resolve) => { ready = resolve; });
  api.defaults.adapter = (config) => new Promise((resolve, reject) => {
    rejectRequest = () => reject({ response: { status: 401 }, config });
    ready();
  });
  const request = authService.me();
  await started;
  values.set("borrowapp_admin_token", "new-token");
  rejectRequest();
  await assert.rejects(request);
  assert.equal(values.get("borrowapp_admin_token"), "new-token");
});
