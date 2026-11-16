import { useEffect, useState } from "react";
import {
  X,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
} from "lucide-react";
import { adminService, getErrorMessage } from "../api/client";

export function ResolveReportModal({ report, onClose, onConfirm, submitting }) {
  const [sancion, setSancion] = useState("ADVERTENCIA");
  const [sancionHasta, setSancionHasta] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");

  if (!report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (nota.trim().length < 3) {
      setError("Escribe una nota de resolución de al menos 3 caracteres.");
      return;
    }
    if (sancion === "SUSPENSION" && !sancionHasta) {
      setError("Selecciona la fecha de finalización de la suspensión.");
      return;
    }
    if (sancion === "SUSPENSION" && new Date(sancionHasta).getTime() <= Date.now()) {
      setError("La suspensión debe finalizar en una fecha futura.");
      return;
    }

    try {
      await onConfirm(report.id, {
        sancion,
        nota_resolucion: nota.trim(),
        sancion_hasta:
          sancion === "SUSPENSION" ? new Date(sancionHasta).toISOString() : null,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-hero bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-linea pb-4">
          <div className="flex items-center gap-2 text-laguna-700">
            <ShieldAlert className="h-5 w-5 text-sol-500" />
            <h3 className="text-lg font-bold text-tinta">
              Resolver Reporte #{report.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-campo p-1.5 text-tinta2 hover:bg-bruma"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-tarjeta bg-sal p-4 text-sm">
          <p className="text-tinta">
            <span className="font-semibold">Objeto:</span> {report.objeto}
          </p>
          <p className="mt-0.5 text-tinta">
            <span className="font-semibold">Reportado:</span>{" "}
            <span className="font-semibold text-sistema-error">
              {report.reportado?.nombre}
            </span>{" "}
            <span className="text-tinta2">
              (Reporta: {report.reportante?.nombre})
            </span>
          </p>
          <p className="mt-2 italic text-tinta2">"{report.descripcion}"</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tinta2">
              Decisión disciplinaria (RF-017)
            </label>
            <select
              value={sancion}
              onChange={(e) => setSancion(e.target.value)}
              className="mt-1.5 w-full rounded-campo border border-linea bg-white px-4 py-3 text-sm text-tinta focus:border-laguna-500 focus:outline-none focus:ring-2 focus:ring-laguna-500/20"
            >
              <option value="ADVERTENCIA">
                Advertencia (Mantiene acceso con aviso)
              </option>
              <option value="SUSPENSION">
                Suspensión Temporal (Bloquea nuevas acciones)
              </option>
              <option value="BANEO">
                Baneo Permanente (Retiro definitivo de la comunidad)
              </option>
            </select>
          </div>

          {sancion === "SUSPENSION" && (
            <div>
              <label className="block text-xs font-semibold text-tinta2">
                Suspendido hasta
              </label>
              <input
                type="datetime-local"
                value={sancionHasta}
                onChange={(e) => setSancionHasta(e.target.value)}
                className="mt-1.5 w-full rounded-campo border border-linea bg-white px-4 py-3 text-sm text-tinta focus:border-laguna-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-tinta2">
              Nota de resolución (motivo visible para el usuario)
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Se verificó retraso de 48 horas en la devolución..."
              className="mt-1.5 w-full rounded-campo border border-linea bg-white px-4 py-3 text-sm text-tinta placeholder:text-tinta3 focus:border-laguna-500 focus:outline-none focus:ring-2 focus:ring-laguna-500/20"
            />
          </div>

          {error && (
            <p className="rounded-campo bg-sistema-errorFondo p-3 text-xs font-semibold text-sistema-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-tarjeta border border-lineaFuerte px-5 py-2.5 text-sm font-bold text-tinta2 hover:bg-bruma"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-tarjeta bg-laguna-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-laguna-800 disabled:bg-bruma disabled:text-tinta3"
            >
              {submitting ? "Aplicando..." : "Confirmar y Resolver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditCentralPointModal({ org, onClose, onSave }) {
  const [punto, setPunto] = useState(org?.punto_central || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (punto.trim().length < 2) {
      setError("Ingresa un punto central válido.");
      return;
    }
    setSaving(true);
    try {
      await onSave(punto.trim());
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-hero bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-linea pb-3">
          <div className="flex items-center gap-2 text-laguna-700">
            <MapPin className="h-5 w-5 text-sol-500" />
            <h3 className="text-lg font-bold text-tinta">
              Modificar Punto Central
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-campo p-1.5 text-tinta2 hover:bg-bruma"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-tinta2">
          Este cambio aplicará a todos los préstamos futuros. Los préstamos ya
          confirmados conservan su punto original.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text"
            maxLength={200}
            value={punto}
            onChange={(e) => setPunto(e.target.value)}
            className="w-full rounded-campo border border-linea bg-white px-4 py-3 text-sm text-tinta focus:border-laguna-500 focus:outline-none focus:ring-2 focus:ring-laguna-500/20"
          />
          {error && (
            <p className="text-xs font-semibold text-sistema-error">{error}</p>
          )}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-tarjeta border border-lineaFuerte px-4 py-2.5 text-sm font-bold text-tinta2 hover:bg-bruma"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-tarjeta bg-laguna-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-laguna-800"
            >
              {saving ? "Guardando..." : "Guardar cambio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoanDetailModal({ loan, onClose }) {
  if (!loan) return null;

  const pasos = [
    {
      titulo: "1. Entrega marcada por Prestador",
      actor: loan.prestador?.nombre,
      fecha: loan.entrega_prestador_en,
    },
    {
      titulo: "2. Recepción confirmada por Solicitante",
      actor: loan.solicitante?.nombre,
      fecha: loan.entrega_solicitante_en,
    },
    {
      titulo: "3. Devolución marcada por Solicitante",
      actor: loan.solicitante?.nombre,
      fecha: loan.devolucion_solicitante_en,
    },
    {
      titulo: "4. Devolución confirmada por Prestador",
      actor: loan.prestador?.nombre,
      fecha: loan.devolucion_prestador_en,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-hero bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-linea pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-tinta3">
              Auditoría de Préstamo #{loan.id}
            </span>
            <h3 className="text-lg font-bold text-tinta">{loan.objeto}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-campo p-1.5 text-tinta2 hover:bg-bruma"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-tarjeta bg-sal p-4 text-xs">
          <div>
            <span className="text-tinta2">Punto acordado:</span>
            <p className="mt-0.5 font-semibold text-tinta">
              {loan.punto_central}
            </p>
          </div>
          <div>
            <span className="text-tinta2">Modalidad / Total:</span>
            <p className="mt-0.5 font-semibold text-tinta">
              {loan.modalidad} · ${loan.precio_total.toLocaleString("es-CO")}
            </p>
          </div>
          <div>
            <span className="text-tinta2">Inicio:</span>
            <p className="mt-0.5 font-semibold text-tinta">
              {new Date(loan.fecha_inicio).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-tinta2">Límite devolución:</span>
            <p
              className={`mt-0.5 font-semibold ${
                loan.vencido ? "text-sistema-error" : "text-tinta"
              }`}
            >
              {new Date(loan.fecha_fin).toLocaleDateString()}{" "}
              {loan.vencido && "(VENCIDO)"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-tinta2">
            Confirmaciones Cruzadas (RF-012 / RF-013)
          </h4>
          {pasos.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-campo border border-linea bg-white px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                {p.fecha ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-sistema-exito" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-tinta3" />
                )}
                <div>
                  <p className="font-semibold text-tinta">{p.titulo}</p>
                  <p className="text-tinta2">{p.actor}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-tinta2">
                {p.fecha
                  ? new Date(p.fecha).toLocaleString("es-CO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "Pendiente"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-tarjeta bg-laguna-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-laguna-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function NeedOffersModal({ need, onClose }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!need) return;
    let current = true;
    setLoading(true);
    setError("");
    setOffers([]);
    adminService
      .getNeedOffers(need.id)
      .then((data) => { if (current) setOffers(data); })
      .catch((err) => { if (current) setError(getErrorMessage(err)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [need?.id, attempt]);

  if (!need) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-hero bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-linea pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-tinta3">
              Ofertas de Necesidad #{need.id}
            </span>
            <h3 className="text-lg font-bold text-tinta">{need.objeto}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-campo p-1.5 text-tinta2 hover:bg-bruma"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2.5 text-xs text-tinta2">
          Solicitante: <strong className="text-tinta">{need.solicitante?.nombre}</strong> · Del{" "}
          {new Date(need.fecha_inicio).toLocaleDateString()} al{" "}
          {new Date(need.fecha_fin).toLocaleDateString()}
        </p>

        <div className="mt-4 max-h-80 space-y-2.5 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-xs text-tinta2">
              Cargando ofertas...
            </p>
          ) : error ? (
            <p role="alert" className="text-sm text-sistema-error">{error} <button className="underline" onClick={() => setAttempt(attempt + 1)}>Reintentar</button></p>
          ) : offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-tarjeta bg-sal py-8 text-xs text-tinta2">
              <AlertCircle className="mb-1.5 h-5 w-5 text-tinta3" />
              Aún no hay ofertas registradas para esta necesidad.
            </div>
          ) : (
            offers.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-campo border border-linea bg-white p-3.5 text-xs"
              >
                <div>
                  <p className="font-bold text-tinta">{o.prestador?.nombre}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-tinta2">
                    <Tag className="h-3.5 w-3.5 text-laguna-600" />
                    {o.modalidad === "GRATIS"
                      ? "Préstamo Gratuito ($0)"
                      : `Alquiler: $${o.precio?.toLocaleString("es-CO")} / ${o.unidad_cobro} · Total: $${o.total_calculado?.toLocaleString("es-CO")}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    o.estado === "ACEPTADA"
                      ? "bg-sistema-exitoFondo text-sistema-exito"
                      : o.estado === "PENDIENTE"
                      ? "bg-sol-100 text-sol-texto"
                      : "bg-bruma text-tinta2"
                  }`}
                >
                  {o.estado}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-tarjeta bg-laguna-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-laguna-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
