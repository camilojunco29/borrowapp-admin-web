import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  PackageSearch,
  ArrowLeftRight,
  AlertTriangle,
  MapPin,
  Copy,
  Check,
  LogOut,
  RotateCcw,
  Building2,
  Search,
  Download,
  RefreshCw,
  Eye,
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { adminService, getErrorMessage } from "./api/client";
import { exportToCsv } from "./utils/exportCsv";
import {
  ResolveReportModal,
  EditCentralPointModal,
  LoanDetailModal,
  NeedOffersModal,
} from "./components/AdminModals";

function LoginScreen() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(correo, contrasena);
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-marea p-4">
      <div className="w-full max-w-md rounded-hero bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-laguna-50 px-3.5 py-1 text-xs font-bold text-laguna-700">
            BorrowApp · Administración
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-tinta">
            BorrowApp Admin
          </h1>
          <p className="mt-1 text-sm text-tinta2">
            Ingresa con tu cuenta de administrador de comunidad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tinta2">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@comunidad.com"
              className="mt-1.5 w-full rounded-campo border border-linea bg-white px-4 py-3 text-sm text-tinta placeholder:text-tinta3 focus:border-laguna-500 focus:outline-none focus:ring-2 focus:ring-laguna-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-tinta2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-campo border border-linea bg-white px-4 py-3 text-sm text-tinta placeholder:text-tinta3 focus:border-laguna-500 focus:outline-none focus:ring-2 focus:ring-laguna-500/20"
            />
          </div>

          {error && (
            <div className="rounded-campo bg-sistema-errorFondo p-3 text-xs font-semibold text-sistema-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-tarjeta bg-laguna-700 py-3.5 text-sm font-bold text-white transition hover:bg-laguna-800 disabled:bg-bruma disabled:text-tinta3"
          >
            {loading ? "Verificando permisos..." : "Entrar al Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BadgeEstado({ estado }) {
  const styles = {
    ACTIVO: "bg-sistema-exitoFondo text-sistema-exito",
    ADVERTIDO: "bg-sol-100 text-sol-texto",
    SUSPENDIDO: "bg-sol-100 text-sol-700",
    BANEADO: "bg-sistema-errorFondo text-sistema-error",
    PENDIENTE: "bg-sol-100 text-sol-texto",
    RESUELTO: "bg-bruma text-tinta2",
    BUSCANDO_PRESTADOR: "bg-sol-100 text-sol-texto",
    CON_PRESTAMO_CONFIRMADO: "bg-laguna-100 text-laguna-800",
    CONFIRMADO: "bg-laguna-100 text-laguna-800",
    ENTREGA_PENDIENTE: "bg-sistema-infoFondo text-sistema-info",
    DEVOLUCION_PENDIENTE: "bg-laguna-200/60 text-laguna-900",
    FINALIZADO: "bg-sistema-exitoFondo text-sistema-exito",
    CERRADA: "bg-bruma text-tinta2",
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[estado] || "bg-bruma text-tinta2"
      }`}
    >
      {estado?.replaceAll("_", " ")}
    </span>
  );
}

function Dashboard() {
  const { user, adminMemberships, activeOrg, setActiveOrg, updateOrganization, logout } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [members, setMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");
  const [reverting, setReverting] = useState(false);
  const requestVersion = useRef(0);
  const [copied, setCopied] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [toast, setToast] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [editingPoint, setEditingPoint] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedNeed, setSelectedNeed] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadAll = async () => {
    if (!activeOrg) return;
    const version = ++requestVersion.current;
    setLoadingData(true);
    setDataError("");
    try {
      const [m, r, n, l] = await Promise.all([
        adminService.getMembers(activeOrg.id),
        adminService.getReports(activeOrg.id),
        adminService.getNeeds(activeOrg.id),
        adminService.getLoans(activeOrg.id),
      ]);
      if (version !== requestVersion.current) return false;
      if (![m, r, n, l].every(Array.isArray)) throw new Error("La API devolvió un formato de datos inesperado. Reintenta la carga.");
      setMembers(m);
      setReports(r);
      setNeeds(n);
      setLoans(l);
      return true;
    } catch (error) {
      if (version === requestVersion.current) {
        setMembers([]); setReports([]); setNeeds([]); setLoans([]);
        setDataError(getErrorMessage(error));
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoadingData(false);
    }
  };

  useEffect(() => {
    setSearch("");
    setStatusFilter("TODOS");
    setMembers([]); setReports([]); setNeeds([]); setLoans([]);
    setSelectedReport(null); setSelectedLoan(null); setSelectedNeed(null); setEditingPoint(false);
    loadAll();
    return () => { requestVersion.current += 1; };
  }, [activeOrg?.id]);

  const handleCopyCode = async () => {
    try { await navigator.clipboard.writeText(activeOrg.codigo); }
    catch { showToast("No se pudo copiar el código. Puedes copiarlo manualmente."); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResolveReport = async (reportId, payload) => {
    setSubmittingReport(true);
    try {
      await adminService.resolveReport(reportId, payload);
      const refreshed = await loadAll();
      showToast(`Reporte #${reportId} resuelto y sanción aplicada.${refreshed ? "" : " Reintenta la carga para ver los datos actualizados."}`);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleRevertSanction = async (userId, nombre) => {
    if (!window.confirm(`¿Restaurar la membresía de ${nombre} a estado ACTIVO?`))
      return;
    setReverting(true);
    try {
      await adminService.revertSanction(activeOrg.id, userId);
      const refreshed = await loadAll();
      showToast(`Membresía de ${nombre} restaurada a ACTIVO.${refreshed ? "" : " Reintenta la carga para ver los datos actualizados."}`);
    } catch (error) { showToast(getErrorMessage(error)); }
    finally { setReverting(false); }
  };

  const handleSaveCentralPoint = async (nuevoPunto) => {
    const updatedOrg = await adminService.updateCentralPoint(
      activeOrg.id,
      nuevoPunto
    );
    updateOrganization({ ...activeOrg, ...updatedOrg });
    showToast("Punto central actualizado correctamente.");
  };

  const stats = useMemo(() => {
    const pendingReports = reports.filter((r) => r.estado === "PENDIENTE").length;
    const activeLoans = loans.filter((l) => l.estado !== "FINALIZADO").length;
    const overdueLoans = loans.filter((l) => l.vencido).length;
    const freeLoans = loans.filter((l) => l.modalidad === "GRATIS").length;
    const paidLoans = loans.filter((l) => l.modalidad === "ALQUILER").length;
    const totalVolume = loans.reduce((acc, l) => acc + (l.precio_total || 0), 0);
    return {
      pendingReports,
      activeLoans,
      overdueLoans,
      freeLoans,
      paidLoans,
      totalVolume,
    };
  }, [reports, loans]);

  const filteredReports = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter((r) => {
      const matchStatus =
        statusFilter === "TODOS" || r.estado === statusFilter;
      const matchQuery =
        !q ||
        String(r.id).includes(q) || String(r.prestamo_id).includes(q) ||
        r.objeto?.toLowerCase().includes(q) ||
        r.reportado?.nombre?.toLowerCase().includes(q) ||
        r.reportante?.nombre?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [reports, search, statusFilter]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      const matchStatus =
        statusFilter === "TODOS" || m.estado === statusFilter;
      const matchQuery =
        !q ||
        String(m.usuario_id).includes(q) || String(m.membresia_id).includes(q) ||
        m.nombre?.toLowerCase().includes(q) ||
        m.correo?.toLowerCase().includes(q) ||
        m.identificador_interno?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [members, search, statusFilter]);

  const filteredLoans = useMemo(() => {
    const q = search.toLowerCase();
    return loans.filter((l) => {
      const matchStatus =
        statusFilter === "TODOS" ||
        (statusFilter === "VENCIDOS" ? l.vencido : l.estado === statusFilter);
      const matchQuery =
        !q ||
        String(l.id).includes(q) ||
        l.objeto?.toLowerCase().includes(q) ||
        l.solicitante?.nombre?.toLowerCase().includes(q) ||
        l.prestador?.nombre?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [loans, search, statusFilter]);

  const filteredNeeds = useMemo(() => {
    const q = search.toLowerCase();
    return needs.filter((n) => {
      const matchStatus =
        statusFilter === "TODOS" || n.estado === statusFilter;
      const matchQuery =
        !q ||
        String(n.id).includes(q) ||
        n.objeto?.toLowerCase().includes(q) ||
        n.solicitante?.nombre?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [needs, search, statusFilter]);

  const handleExportCurrentTab = () => {
    if (tab === "miembros") {
      exportToCsv(
        `miembros_${activeOrg.codigo}`,
        filteredMembers.map((m) => ({
          Nombre: m.nombre,
          Correo: m.correo,
          Identificador: m.identificador_interno,
          Rol: m.rol,
          Estado: m.estado,
          Motivo_Sancion: m.sancion_motivo || "",
        }))
      );
    } else if (tab === "prestamos") {
      exportToCsv(
        `prestamos_${activeOrg.codigo}`,
        filteredLoans.map((l) => ({
          ID: l.id,
          Objeto: l.objeto,
          Solicitante: l.solicitante?.nombre,
          Prestador: l.prestador?.nombre,
          Modalidad: l.modalidad,
          Total_COP: l.precio_total,
          Estado: l.estado,
          Vencido: l.vencido ? "SI" : "NO",
          En_Conflicto: l.en_conflicto ? "SI" : "NO",
        }))
      );
    } else if (tab === "resumen") {
      exportToCsv(
        `reportes_${activeOrg.codigo}`,
        filteredReports.map((r) => ({
          ID: r.id,
          Prestamo_ID: r.prestamo_id,
          Objeto: r.objeto,
          Tipo: r.tipo,
          Reportante: r.reportante?.nombre,
          Reportado: r.reportado?.nombre,
          Estado: r.estado,
          Sancion: r.sancion || "",
          Nota_Resolucion: r.nota_resolucion || "",
        }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-sal text-tinta">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-campo bg-tinta px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <header className="border-b border-linea bg-sal/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-campo bg-laguna-700 font-extrabold text-white">
              BA
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-tinta">
                BorrowApp · Administración
              </h1>
              <p className="text-xs text-tinta2">Hola, {user?.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAll}
              disabled={loadingData || submittingReport || reverting}
              title="Actualizar datos"
              className="rounded-campo border border-linea bg-white p-2.5 text-laguna-700 transition hover:bg-laguna-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`}
              />
            </button>

            <div className="flex items-center gap-2 rounded-campo border border-linea bg-white px-3.5 py-2 text-sm">
              <Building2 className="h-4 w-4 text-laguna-700" />
              <select
                value={activeOrg?.id || ""}
                disabled={submittingReport || reverting || editingPoint}
                onChange={(e) => {
                  const found = adminMemberships.find(
                    (m) => m.organizacion_id === Number(e.target.value)
                  );
                  if (found) setActiveOrg(found.organizacion);
                }}
                className="bg-transparent font-semibold text-tinta focus:outline-none"
              >
                {adminMemberships.map((m) => (
                  <option
                    key={m.id}
                    value={m.organizacion_id}
                    className="text-tinta"
                  >
                    {m.organizacion.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-campo border border-linea bg-white px-3.5 py-2 text-xs font-bold text-tinta2 transition hover:bg-bruma hover:text-tinta"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-6 rounded-hero bg-marea p-6 text-white shadow-md md:grid-cols-2 md:p-7">
          <div className="flex flex-col justify-between">
            <div>
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-laguna-50">
                Comunidad · {activeOrg?.tipo?.replaceAll("_", " ")}
              </span>
              <h2 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {activeOrg?.nombre}
              </h2>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-laguna-100">Código de acceso:</span>
              <code className="rounded-campo bg-white/15 px-3.5 py-1.5 font-mono text-base font-bold tracking-widest text-white">
                {activeOrg?.codigo}
              </code>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-full bg-sol-400 px-3.5 py-1.5 text-xs font-bold text-sol-texto transition hover:bg-sol-500"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar código
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-tarjeta bg-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-laguna-100">
                  <MapPin className="h-4 w-4 text-sol-400" /> Punto Central de
                  Entrega y Devolución
                </span>
                <p className="mt-1.5 text-base font-bold text-white">
                  {activeOrg?.punto_central}
                </p>
              </div>
              <button
                onClick={() => setEditingPoint(true)}
                className="shrink-0 rounded-tarjeta bg-white px-4 py-2 text-xs font-bold text-laguna-800 transition hover:bg-laguna-50"
              >
                Modificar
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 border-t border-white/15 pt-3 text-xs text-laguna-100">
              <span>
                Gratuitos: <strong className="text-white">{stats.freeLoans}</strong>
              </span>
              <span>
                Alquileres: <strong className="text-white">{stats.paidLoans}</strong>
              </span>
              <span>
                Acordado:{" "}
                <strong className="text-white">
                  ${stats.totalVolume.toLocaleString("es-CO")}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-tarjeta border border-linea bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-tinta2">Miembros</span>
              <div className="rounded-campo bg-laguna-50 p-2 text-laguna-700">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-tinta">
              {members.length}
            </p>
          </div>

          <div className="rounded-tarjeta border border-linea bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-tinta2">
                Publicaciones
              </span>
              <div className="rounded-campo bg-sistema-infoFondo p-2 text-sistema-info">
                <PackageSearch className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-tinta">
              {needs.length}
            </p>
          </div>

          <div className="rounded-tarjeta border border-linea bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-tinta2">
                Préstamos en curso
              </span>
              <div className="rounded-campo bg-sistema-exitoFondo p-2 text-sistema-exito">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-tinta">
                {stats.activeLoans}
              </p>
              {stats.overdueLoans > 0 && (
                <span className="rounded-full bg-sistema-errorFondo px-2.5 py-0.5 text-[11px] font-bold text-sistema-error">
                  {stats.overdueLoans} vencido(s)
                </span>
              )}
            </div>
          </div>

          <div
            className={`rounded-tarjeta border p-5 ${
              stats.pendingReports > 0
                ? "border-sol-400 bg-sol-50"
                : "border-linea bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  stats.pendingReports > 0 ? "text-sol-texto" : "text-tinta2"
                }`}
              >
                Reportes pendientes
              </span>
              <div
                className={`rounded-campo p-2 ${
                  stats.pendingReports > 0
                    ? "bg-sol-100 text-sol-700"
                    : "bg-bruma text-tinta2"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p
              className={`mt-2 text-3xl font-extrabold ${
                stats.pendingReports > 0 ? "text-sol-700" : "text-tinta"
              }`}
            >
              {stats.pendingReports}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-linea pb-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "resumen",
                label: `Reportes (${stats.pendingReports} pendientes)`,
              },
              { id: "miembros", label: `Miembros (${members.length})` },
              { id: "prestamos", label: `Préstamos (${loans.length})` },
              { id: "necesidades", label: `Necesidades (${needs.length})` },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setStatusFilter("TODOS");
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  tab === item.id
                    ? "bg-laguna-700 text-white"
                    : "border border-linea bg-white text-tinta2 hover:bg-bruma hover:text-tinta"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-tinta3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar persona, objeto o ID..."
                className="rounded-campo border border-linea bg-white py-2 pl-9 pr-3.5 text-xs text-tinta placeholder:text-tinta3 focus:border-laguna-500 focus:outline-none"
              />
            </div>

            {tab === "resumen" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-campo border border-linea bg-white px-3.5 py-2 text-xs font-semibold text-tinta focus:border-laguna-500 focus:outline-none"
              >
                <option value="TODOS">Todos los reportes</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="RESUELTO">Resueltos</option>
              </select>
            )}

            {tab === "miembros" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-campo border border-linea bg-white px-3.5 py-2 text-xs font-semibold text-tinta focus:border-laguna-500 focus:outline-none"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="ADVERTIDO">Advertidos</option>
                <option value="SUSPENDIDO">Suspendidos</option>
                <option value="BANEADO">Baneados</option>
              </select>
            )}

            {tab === "prestamos" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-campo border border-linea bg-white px-3.5 py-2 text-xs font-semibold text-tinta focus:border-laguna-500 focus:outline-none"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="ENTREGA_PENDIENTE">Entrega pendiente</option>
                <option value="ACTIVO">Activo</option>
                <option value="DEVOLUCION_PENDIENTE">Devolución pendiente</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="VENCIDOS">Solo vencidos</option>
              </select>
            )}

            {tab !== "necesidades" && (
              <button
                onClick={handleExportCurrentTab}
                disabled={loadingData || !!dataError}
                className="inline-flex items-center gap-1.5 rounded-campo border border-laguna-700 bg-white px-3.5 py-2 text-xs font-bold text-laguna-700 transition hover:bg-laguna-50"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            )}
          </div>
        </div>

        {dataError && <div role="alert" className="mb-4 rounded-campo bg-sistema-errorFondo p-4 text-sm text-sistema-error">{dataError} <button className="font-bold underline" onClick={loadAll}>Reintentar</button></div>}
        {loadingData ? (
          <div className="rounded-tarjeta border border-linea bg-white p-12 text-center text-sm text-tinta2">
            Cargando datos de {activeOrg?.nombre}...
          </div>
        ) : dataError ? null : (
          <>
            {tab === "resumen" && (
              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <div className="rounded-tarjeta border border-linea bg-white p-10 text-center text-sm text-tinta2">
                    No hay reportes que coincidan con el filtro.
                  </div>
                ) : (
                  filteredReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="flex flex-col justify-between gap-4 rounded-tarjeta border border-linea bg-white p-5 md:flex-row md:items-center"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <BadgeEstado estado={rep.estado} />
                          <span className="rounded-full bg-bruma px-3 py-0.5 text-xs font-semibold text-tinta">
                            {rep.tipo.replaceAll("_", " ")}
                          </span>
                          <span className="text-xs text-tinta3">
                            Préstamo #{rep.prestamo_id} · {rep.objeto}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-tinta">
                          Reportado:{" "}
                          <span className="text-sistema-error">
                            {rep.reportado?.nombre}
                          </span>{" "}
                          <span className="font-normal text-tinta2">
                            (por {rep.reportante?.nombre})
                          </span>
                        </p>
                        <p className="text-sm text-tinta2">{rep.descripcion}</p>
                        {rep.estado === "RESUELTO" && (
                          <p className="mt-2 rounded-campo bg-sal p-2.5 text-xs text-tinta2">
                            <strong className="text-tinta">
                              Resolución ({rep.sancion}):
                            </strong>{" "}
                            {rep.nota_resolucion}
                          </p>
                        )}
                      </div>

                      {rep.estado === "PENDIENTE" && (
                        <button
                          onClick={() => setSelectedReport(rep)}
                          className="shrink-0 rounded-tarjeta bg-sol-400 px-5 py-2.5 text-xs font-bold text-sol-texto transition hover:bg-sol-500"
                        >
                          Atender y Sancionar
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "miembros" && (
              <div className="overflow-x-auto rounded-tarjeta border border-linea bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-linea bg-bruma/60 text-xs uppercase text-tinta2">
                    <tr>
                      <th className="px-5 py-3.5">Miembro</th>
                      <th className="px-5 py-3.5">Identificador Interno</th>
                      <th className="px-5 py-3.5">Rol</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linea">
                    {filteredMembers.map((m) => (
                      <tr key={m.membresia_id} className="hover:bg-sal/50">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-tinta">{m.nombre}</p>
                          <p className="text-xs text-tinta2">{m.correo}</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-tinta">
                          {m.identificador_interno}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-laguna-700">
                          {m.rol}
                        </td>
                        <td className="px-5 py-3.5">
                          <BadgeEstado estado={m.estado} />
                          {m.sancion_motivo && m.estado !== "ACTIVO" && (
                            <p className="mt-1 max-w-xs truncate text-[11px] text-tinta2">
                              Motivo: {m.sancion_motivo}
                            </p>
                          )}
                          {m.sancion_hasta && m.estado === "SUSPENDIDO" && (
                            <p className="text-[11px] font-semibold text-sol-700">
                              Hasta:{" "}
                              {new Date(m.sancion_hasta).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {m.estado !== "ACTIVO" && (
                            <button
                              onClick={() =>
                                handleRevertSanction(m.usuario_id, m.nombre)
                              }
                              disabled={reverting}
                              className="inline-flex items-center gap-1 rounded-full bg-sistema-exitoFondo px-3 py-1 text-xs font-bold text-sistema-exito transition hover:opacity-80"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Revertir
                              sanción
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "prestamos" && (
              <div className="overflow-x-auto rounded-tarjeta border border-linea bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-linea bg-bruma/60 text-xs uppercase text-tinta2">
                    <tr>
                      <th className="px-5 py-3.5">Objeto</th>
                      <th className="px-5 py-3.5">Partes</th>
                      <th className="px-5 py-3.5">Modalidad / Total</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5">Auditoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linea">
                    {filteredLoans.map((l) => (
                      <tr key={l.id} className="hover:bg-sal/50">
                        <td className="px-5 py-3.5 font-bold text-tinta">
                          #{l.id} · {l.objeto}
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {l.en_conflicto && (
                              <span className="rounded-full bg-sistema-error px-2 py-0.5 text-[10px] font-bold text-white">
                                EN CONFLICTO
                              </span>
                            )}
                            {l.vencido && (
                              <span className="rounded-full bg-sol-400 px-2 py-0.5 text-[10px] font-bold text-sol-texto">
                                VENCIDO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <p className="text-tinta">
                            Solicitante: <strong>{l.solicitante?.nombre}</strong>
                          </p>
                          <p className="text-tinta2">
                            Prestador: {l.prestador?.nombre}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-tinta">
                          {l.modalidad} ($
                          {l.precio_total.toLocaleString("es-CO")})
                        </td>
                        <td className="px-5 py-3.5">
                          <BadgeEstado estado={l.estado} />
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setSelectedLoan(l)}
                            className="inline-flex items-center gap-1 rounded-full border border-laguna-700 px-3 py-1 text-xs font-bold text-laguna-700 transition hover:bg-laguna-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver pasos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "necesidades" && (
              <div className="overflow-x-auto rounded-tarjeta border border-linea bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-linea bg-bruma/60 text-xs uppercase text-tinta2">
                    <tr>
                      <th className="px-5 py-3.5">Objeto</th>
                      <th className="px-5 py-3.5">Solicitante</th>
                      <th className="px-5 py-3.5">Fechas</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5">Ofertas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linea">
                    {filteredNeeds.map((n) => (
                      <tr key={n.id} className="hover:bg-sal/50">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-tinta">{n.objeto}</p>
                          <p className="max-w-md truncate text-xs text-tinta2">
                            {n.descripcion}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-tinta">
                          {n.solicitante?.nombre}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-tinta2">
                          {new Date(n.fecha_inicio).toLocaleDateString()} -{" "}
                          {new Date(n.fecha_fin).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <BadgeEstado estado={n.estado} />
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setSelectedNeed(n)}
                            className="inline-flex items-center gap-1 rounded-full bg-laguna-50 px-3 py-1 text-xs font-bold text-laguna-700 transition hover:bg-laguna-100"
                          >
                            Ver ({n.ofertas_pendientes} pend.)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      <ResolveReportModal
        key={selectedReport?.id || "none"}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onConfirm={handleResolveReport}
        submitting={submittingReport}
      />

      {editingPoint && (
        <EditCentralPointModal
          org={activeOrg}
          onClose={() => setEditingPoint(false)}
          onSave={handleSaveCentralPoint}
        />
      )}

      <LoanDetailModal
        loan={selectedLoan}
        onClose={() => setSelectedLoan(null)}
      />

      <NeedOffersModal
        need={selectedNeed}
        onClose={() => setSelectedNeed(null)}
      />
    </div>
  );
}

function AppContent() {
  const { user, loading, sessionError, restoreSession, logout, activeOrg } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sal text-sm font-medium text-tinta2">
        Cargando BorrowApp Admin...
      </div>
    );
  }
  if (sessionError) return <div className="min-h-screen bg-sal p-8" role="alert">
    <p>{sessionError}</p><button className="m-3 underline" onClick={restoreSession}>Reintentar conexión</button>
    <button className="m-3 underline" onClick={logout}>Volver al inicio de sesión</button>
  </div>;
  if (user && !activeOrg) return <div className="min-h-screen bg-sal p-8">
    <p>Tu cuenta no administra ninguna organización disponible. Crea una comunidad desde la app móvil.</p>
    <button className="m-3 underline" onClick={restoreSession}>Actualizar permisos</button>
    <button className="m-3 underline" onClick={logout}>Salir</button>
  </div>;
  return user ? <Dashboard /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
