export function adminMembershipsFrom(data) {
  return (Array.isArray(data?.membresias) ? data.membresias : [])
    .filter((m) => m.rol === "ADMINISTRADOR" && m.organizacion?.id)
    .map((m) => ({ ...m, organizacion_id: m.organizacion.id }));
}

export function mergeOrganization(memberships, organization) {
  return memberships.map((m) => Number(m.organizacion.id) === Number(organization.id)
    ? { ...m, organizacion: { ...m.organizacion, ...organization } }
    : m);
}
