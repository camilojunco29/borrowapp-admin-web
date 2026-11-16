import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell, exportToCsv } from "../src/utils/exportCsv.js";
import { adminMembershipsFrom, mergeOrganization } from "../src/utils/organizations.js";
import { saveSessionToken, getSessionToken, clearSession, getTokenExpiry } from "../src/api/session.js";

test("CSV neutraliza fórmulas, variantes Unicode y prefijos ocultos", () => {
  for (const text of ["=1+1", "+SUM(1,1)", "-1+2", "@SUM(1,1)", "  =1", "\u0000=1", "\t=1", "\r=1", "\n=1", "＝1", "＋1", "－1", "＠SUM(1)"]) {
    assert.ok(escapeCsvCell(text).startsWith('"\t'), JSON.stringify(text));
  }
  assert.equal(escapeCsvCell('Objeto, "nuevo"'), '"Objeto, ""nuevo"""');
  assert.equal(escapeCsvCell(123), '"123"');
  assert.equal(escapeCsvCell(null), '""');
});

test("la exportación neutraliza tanto cabeceras como datos de usuario", async () => {
  let captured;
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  URL.createObjectURL = (blob) => { captured = blob; return "blob:test"; };
  URL.revokeObjectURL = () => {};
  globalThis.document = { createElement: () => ({ setAttribute() {}, click() {} }), body: { appendChild() {}, removeChild() {} } };
  try {
    exportToCsv("test", [{ "=campo": "=1+1" }]);
    assert.equal(await captured.text(), '"\t=campo"\n"\t=1+1"');
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    delete globalThis.document;
  }
});

test("actualizar punto central actualiza la membresía usada al regresar", () => {
  const memberships = adminMembershipsFrom({ membresias: [
    { rol: "ADMINISTRADOR", organizacion: { id: 1, nombre: "Org A", punto_central: "Anterior" } },
    { rol: "ADMINISTRADOR", organizacion: { id: 2, nombre: "Org B" } },
    { rol: "MIEMBRO", organizacion: { id: 3 } },
    { rol: "ADMINISTRADOR", organizacion: null },
  ] });
  assert.equal(memberships.length, 2);
  const updated = mergeOrganization(memberships, { id: 1, punto_central: "Nuevo" });
  assert.equal(updated.find((m) => m.organizacion_id === 1).organizacion.punto_central, "Nuevo");
  assert.equal(updated[0].organizacion.nombre, "Org A");
  assert.equal(updated[1], memberships[1]);
  assert.equal(memberships[0].organizacion.punto_central, "Anterior");
});

test("la sesión es por pestaña y elimina las credenciales persistentes antiguas", () => {
  const values = new Map();
  const removed = [];
  globalThis.sessionStorage = { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
  globalThis.localStorage = { removeItem: (k) => removed.push(k) };
  saveSessionToken("test-token");
  assert.equal(getSessionToken(), "test-token");
  assert.ok(removed.includes("borrowapp_admin_token"));
  clearSession();
  assert.equal(getSessionToken(), null);
  assert.throws(() => saveSessionToken(undefined));
});

test("la lectura de vencimiento no supone que el token esté firmado correctamente", () => {
  const payload = Buffer.from(JSON.stringify({ exp: 2000000000 })).toString("base64url");
  assert.equal(getTokenExpiry(`header.${payload}.signature`), 2000000000000);
  assert.equal(getTokenExpiry("malformed"), null);
  assert.equal(getTokenExpiry("header.e30.signature"), null);
});
