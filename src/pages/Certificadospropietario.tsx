import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowLeft, FileText, Download, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

interface UltimoPago {
  id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago?: string;
  num_recibo?: string;
}

interface Inmueble {
  id: number;
  codigo_catastral: string;
  direccion_completa: string | null;
  estado: string;
  propietario_nombre?: string | null;
  municipio?: { nombre?: string } | null;
  zona?: { numero?: number; nombre?: string } | null;
  via?: { tipo_via?: { nombre?: string } } | null;
  tiene_certificado: boolean;
  vigente: boolean;
  vigente_hasta?: string | null;
  ultimo_pago?: UltimoPago | null;
  pendiente_nit?: { num_recibo: string } | null;
}

export default function InmuebleCertificado() {
  // Acepta ambos nombres de parámetro (:codigo o :id) por si el router quedó con el nombre viejo
  const params = useParams<{ codigo?: string; id?: string }>();
  const codigo = params.codigo ?? params.id;

  const navigate = useNavigate();
  const { apiFetch, apiDownload } = useAuthStore();
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const { data: inmueble, isLoading, error } = useQuery<Inmueble>({
    queryKey: ['inmueble-consulta', codigo],
    queryFn: async () => {
      const r: any = await apiFetch(`inmuebles/consulta/${encodeURIComponent(codigo!)}`);
      const d = r?.data ?? r; // por si apiFetch envolviera la respuesta en { data }
      if (!d || !d.codigo_catastral) {
        console.error('Respuesta inesperada de inmuebles/consulta:', r);
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }
      return d as Inmueble;
    },
    enabled: !!codigo,
    staleTime: 0,
    retry: false,
  });

  const abrirPdf = async (endpoint: string, key: string) => {
    if (downloading) return;
    setMsg('');
    setDownloading(key);
    try {
      const res = await apiDownload(endpoint, { method: 'GET' });
      if (!res.ok) throw new Error('No se pudo descargar el documento');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      setMsg(e?.message || 'Error al descargar el documento');
    } finally {
      setDownloading(null);
    }
  };

  const handlePagar = async () => {
    if (!inmueble || paying) return;
    setPaying(true);
    setMsg('');
    try {
      const resp = await apiFetch('polar/crear-sesion', {
        method: 'POST',
        body: JSON.stringify({ inmueble_id: inmueble.id }),
        headers: { 'Content-Type': 'application/json' },
      });
      const url = typeof resp === 'string' ? resp : resp?.url;
      if (typeof url !== 'string' || !url.startsWith('https://')) {
        throw new Error('No se recibió una URL de pago válida');
      }
      window.location.href = url;
    } catch (e: any) {
      setMsg(e?.message || 'Error al iniciar el pago. Intenta de nuevo.');
      setPaying(false);
    }
  };

  const zona = inmueble?.zona
    ? `${inmueble.zona.numero ?? ''} ${inmueble.zona.nombre ?? ''}`.trim() || '—'
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50 p-4 lg:p-8"
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/consulta')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#2b6cb0] text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Nueva consulta
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#2b6cb0] rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading text-slate-800 text-xl font-bold leading-tight">
              Certificado del inmueble
            </h1>
            <p className="text-slate-400 text-xs font-mono">{codigo ?? 'Sin código en la URL'}</p>
          </div>
        </div>

        {!codigo && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-700 text-sm">
              No se recibió el código catastral en la dirección. Vuelve a hacer la consulta.
            </p>
          </div>
        )}

        {codigo && isLoading && <p className="text-slate-400 text-sm">Cargando...</p>}

        {!isLoading && error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">
              {error instanceof Error ? error.message : 'No se encontró el inmueble'}
            </p>
          </div>
        )}

        {inmueble && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <Dato label="Código catastral" value={inmueble.codigo_catastral} mono />
              <div>
                <dt className="text-slate-400 text-xs mb-0.5">Estado</dt>
                <dd>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      inmueble.estado === 'activo'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {inmueble.estado}
                  </span>
                </dd>
              </div>
              <Dato label="Dirección" value={inmueble.direccion_completa ?? '—'} />
              <Dato label="Municipio" value={inmueble.municipio?.nombre ?? '—'} />
              <Dato label="Zona" value={zona} />
              <Dato label="Vía" value={inmueble.via?.tipo_via?.nombre ?? '—'} />
              {inmueble.propietario_nombre && (
                <Dato label="Propietario" value={inmueble.propietario_nombre} />
              )}
            </dl>

            {msg && (
              <p role="alert" className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                {msg}
              </p>
            )}

            <div className="pt-4 border-t border-slate-100">
              {inmueble.vigente && inmueble.ultimo_pago ? (
                <div className="space-y-3">
                  {inmueble.vigente_hasta && (
                    <p className="text-xs text-green-700">
                      Vigente hasta {new Date(inmueble.vigente_hasta).toLocaleDateString('es-GT')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        abrirPdf(`certificadoauto/inmueble/${inmueble.id}/certificacion`, 'cert')
                      }
                      disabled={!!downloading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm transition-colors disabled:opacity-60"
                    >
                      <Download size={14} />
                      {downloading === 'cert' ? 'Descargando...' : 'Descargar certificado'}
                    </button>
                    <button
                      onClick={() =>
                        abrirPdf(`certificadoauto/${inmueble.ultimo_pago!.id}/constancia`, 'const')
                      }
                      disabled={!!downloading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2b6cb0] text-white hover:bg-[#3182ce] text-sm transition-colors disabled:opacity-60"
                    >
                      <FileText size={14} />
                      {downloading === 'const' ? 'Descargando...' : 'Ver constancia de pago'}
                    </button>
                  </div>
                </div>
              ) : inmueble.pendiente_nit ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Recibimos tu pago. Falta confirmar tu NIT para habilitar el certificado.
                  </p>
                  <Link
                    to={`/confirmar-nit?recibo_id=${encodeURIComponent(
                      inmueble.pendiente_nit.num_recibo
                    )}&codigo=${encodeURIComponent(inmueble.codigo_catastral)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2b6cb0] text-white hover:bg-[#3182ce] text-sm transition-colors"
                  >
                    <FileText size={14} />
                    Completar NIT
                  </Link>
                </div>
              ) : inmueble.estado !== 'activo' ? (
                <p className="text-sm text-slate-500">
                  Este inmueble no está activo, por lo que no se puede emitir certificado en línea.
                </p>
              ) : (
                <button
                  onClick={handlePagar}
                  disabled={paying}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f59e0b] text-white hover:bg-[#d97706] text-sm transition-colors disabled:opacity-60"
                >
                  <CreditCard size={14} />
                  {paying ? 'Redirigiendo...' : 'Pagar'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Dato({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-slate-400 text-xs mb-0.5">{label}</dt>
      <dd className={`text-slate-700 ${mono ? 'font-mono text-[#0f2744]' : ''}`}>{value}</dd>
    </div>
  );
}