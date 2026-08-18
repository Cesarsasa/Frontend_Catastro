import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, MapPin, FileText, User, Download, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { useAuthStore } from '../store/authStore';

interface UltimoPago {
  id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago?: string;
  num_recibo?: string;
  vigente?: boolean;
}

interface Inmueble {
  id: number;
  codigo_catastral: string;
  direccion_completa: string | null;
  municipio?: { nombre?: string } | null;
  zona?: { numero?: number; nombre?: string } | null;
  via?: { tipo_via?: { nombre?: string } } | null;
  estado: string;
  creado_en: string;
  tiene_certificado?: boolean;
  ultimo_pago?: UltimoPago | null;
}

export default function InmueblesPropietario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
   const { apiFetch, apiUpload, apiDownload } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inmuebles-propietario', id],
    queryFn: () => apiFetch(`inmuebles/dpi/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60,
    retry: false,
  });

  const propietario = data?.propietario ?? null;
  const inmuebles: Inmueble[] = data?.inmuebles ?? [];

  const pagoVigente = (pago?: UltimoPago | null) => {
    if (!pago) return false;
    const vigencia = new Date(pago.fecha_pago);
    vigencia.setFullYear(vigencia.getFullYear() + 1);
    return new Date() <= vigencia;
  };

  const handleCrearSesion = async (inmuebleId: number) => {
    try {
      // Ajusta la ruta si tu apiFetch no añade el prefijo /api automáticamente
      const resp = await apiFetch('polar/crear-sesion', {
        method: 'POST',
        body: JSON.stringify({ inmueble_id: inmuebleId, dpi: propietario?.dpi }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Si apiFetch devuelve parsed JSON con { url }
      const url = resp?.url ?? resp;
      if (!url) throw new Error('No se recibió URL de Stripe');

      // Redirigir al checkout de Stripe
      window.location.href = url;
    } catch (err: any) {
      console.error('Error creando sesión de pago:', err);
      // Aquí puedes mostrar una notificación al usuario
      alert(err?.message || 'Error al iniciar el pago. Intenta de nuevo.');
    }
  };
  
const handleDescargarConstancia = async (pagoId: number) => {
  const res = await apiDownload(`certificadoauto/${pagoId}/constancia`, { method: 'GET' });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
};
const handleDescargarcertificado= async (inmuebleId: number) =>  {
  const res = await apiDownload(`certificadoauto/inmueble/${inmuebleId}/certificacion`, { method: 'GET' });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
};

  const columns = [
    {
      key: 'codigo_catastral',
      label: 'Código catastral',
      render: (row: Inmueble) => <span className="font-mono text-[#0f2744]">{row.codigo_catastral}</span>,
    },
    {
      key: 'direccion_completa',
      label: 'Dirección',
      render: (row: Inmueble) => <span className="text-slate-500 text-sm">{row.direccion_completa ?? '—'}</span>,
    },
    {
      key: 'municipio',
      label: 'Municipio',
      render: (row: Inmueble) => <span className="text-slate-600 text-sm">{row.municipio?.nombre ?? '—'}</span>,
    },
    {
      key: 'zona',
      label: 'Zona',
      render: (row: Inmueble) => (
        <span className="text-slate-600 text-sm">
          {row.zona ? `${row.zona.numero ?? ''} ${row.zona.nombre ?? ''}`.trim() : '—'}
        </span>
      ),
    },
    {
      key: 'via',
      label: 'Vía',
      render: (row: Inmueble) => <span className="text-slate-600 text-sm">{row.via?.tipo_via?.nombre ?? '—'}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row: Inmueble) => (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full
            ${row.estado === 'activo' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}
        >
          {row.estado}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: '',
      render: (row: Inmueble) => {
        const pago = row.ultimo_pago ?? null;
        const vigente = pagoVigente(pago);

        if (vigente && pago) {
          const pagoId = pago.id;
          const inmuebelId = row.id;
          return (
            <div className="flex items-center gap-2">
             <button
            onClick={() => handleDescargarcertificado(inmuebelId)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            title="Descargar constancia"
          >
            <Download size={14} />
          </button>

              
              <button
             onClick={() => handleDescargarConstancia(pagoId)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2b6cb0] text-white hover:bg-[#3182ce] transition-colors"
                aria-label="Ver inmueble"
                title="Ver inmueble"
              >
                <FileText size={14} />
              </button>
            </div>
          );
        }

        // No vigente o sin pago -> mostrar botón Pagar
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCrearSesion(row.id)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#f59e0b] text-white hover:bg-[#d97706] transition-colors text-sm"
              title="Realizar pago"
            >
              <CreditCard size={14} />
              <span>Pagar</span>
            </button>

            
          </div>
        );
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50 p-4 lg:p-8"
    >
      <div className="max-w-4xl mx-auto">
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
              Inmuebles del propietario
            </h1>
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <User size={12} /> {propietario ? `${propietario.nombre} — DPI ${propietario.dpi}` : `Propietario #${id}`}
            </p>
          </div>
        </div>

        {!isLoading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">
              {error instanceof Error ? error.message : 'No se encontraron inmuebles'}
            </p>
          </div>
        )}

        {!error && !isLoading && inmuebles.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            Este propietario no tiene inmuebles registrados todavía.
          </div>
        )}

        {!error && inmuebles.length > 0 && (
          <DataTable
            title=""
            data={inmuebles}
            columns={columns}
            searchKeys={['codigo_catastral', 'direccion_completa']}
            canAdd={false}
            canEdit={false}
            canDelete={false}
          />
        )}
      </div>
    </motion.div>
  );
}
