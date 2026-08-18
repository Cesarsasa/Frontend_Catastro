import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select, Textarea } from '../components/FormField';
import StatusBadge from '../components/StatusBadge';

import { mockInmuebles, mockPropietarios, mockMunicipios, mockZonas, mockVias } from '../lib/mockData';
import { useAuthStore } from '../store/authStore';
import MapaUbicacion, { MapaUbicacionPol} from '../components/Map';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MapaOpenLayers from '../components/Map2';


const schema = z.object({
  codigo_catastral: z.string().min(1, 'Requerido').max(20),
  propietario_id: z.coerce.number().optional(),
  municipio_id: z.coerce.number().optional(),
  zona_id: z.coerce.number().optional(),
  via_id: z.coerce.number().optional(),
  numero_casa: z.string().optional(),
  colonia: z.string().optional(),
  referencia: z.string().optional(),
  direccion_completa: z.string().optional(),
  tipo: z.enum(['urbano', 'rural', 'comercial', 'industrial']).optional(),
  uso: z.string().optional(),
  area_m2: z.coerce.number().optional(),
  area_registrada: z.coerce.number().optional(),
  area_real: z.coerce.number().optional(),
  valor_inscrito: z.coerce.number().optional(),
  no_inscripcion_iusi: z.string().optional(),
  finca: z.string().optional(),
  folio: z.string().optional(),
  libro: z.string().optional(),
  coordenadas: z.any().optional(), // Para almacenar el GeoJSON completo
  departamento_registro: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'en_disputa', 'en_proceso']),
    // 🔹 Nuevos campos de ubicación
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  //  poligono_puntos : z.array(z.tuple([z.number(), z.number()])).optional(),
  poligono_puntos: z.array(
  z.object({
    lat: z.number(),
    lng: z.number(),
  })
).optional(),
});
type FormData = z.infer<typeof schema>;

const estadoColors: Record<string, string> = {
  activo: 'bg-emerald-100 text-emerald-700',
  inactivo: 'bg-slate-100 text-slate-600',
  en_disputa: 'bg-red-100 text-red-700',
  en_proceso: 'bg-amber-100 text-amber-700',
};

const estadoLabels: Record<string, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  en_disputa: 'En Disputa',
  en_proceso: 'En Proceso',
};

const tipoColors: Record<string, string> = {
  urbano: 'bg-blue-100 text-blue-700',
  rural: 'bg-green-100 text-green-700',
  comercial: 'bg-orange-100 text-orange-700',
  industrial: 'bg-gray-100 text-gray-700',
};

export default function Inmuebles() {
   const { user, apiFetch, apiUpload } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  //const [data, setData] = useState<Inmueble[]>(mockInmuebles);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Inmueble | null>(null);
  const [deleteItem, setDeleteItem] = useState<Inmueble | null>(null);
    const [submitting, setSubmitting] = useState(false);
  
    // ── Paginación y búsqueda ──
    const queryClient = useQueryClient();
    const [page, setPage]                     = useState(1);
  //  const [pages, setPages]                   = useState(1);
   // const [total, setTotal]                   = useState(0);
    const [search, setSearch]                 = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
      const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Habilitar certificados solo si canWrite o una bandera específica
  const enableCertificados = canWrite; 

  const { register, handleSubmit, watch,reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { estado: 'activo' , lat: 14.63194, lng: -90.92659},
  });

   const handleRemoveFile = (index: number) => {
  setSelectedFiles(prev => prev.filter((_, i) => i !== index));
};



  // ── Debounce: espera 300ms después de que el usuario deja de escribir ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Cuando cambia la búsqueda, volver a página 1 ──
  useEffect(() => { setPage(1); }, [debouncedSearch]);

// ── inmuebles ──
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['inmuebles', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(debouncedSearch && { buscar: debouncedSearch }),
    });
    return apiFetch(`inmuebles?${params}`);
  },
  placeholderData: (prev) => prev,
  staleTime: 1000 * 60,
});


// ── propietario ──
const { data: propietarios } = useQuery({
  queryKey: ['propietarios'],
  queryFn: async () => {
    const res = await apiFetch('propietarios');
    return res.data ?? [];
  },
});


// ── Municipios ──
const { data: municipios } = useQuery({
  queryKey: ['municipios'],
  queryFn: async () => {
    const res = await apiFetch('municipios');
    return res.data ?? [];
  },
});

// Zonas
const municipioId = watch('municipio_id') ;
const { data: zonas } = useQuery({
  queryKey: ['zonas', municipioId],
  queryFn: async () => {
    if (!municipioId) return [];
    const res = await apiFetch(`zonas?municipio_id=${municipioId}`);
    return res.data ?? [];

  },
  enabled: !!municipioId,
});

// ── Vías ──
const zonaId = watch('zona_id');
const { data: vias } = useQuery({
  queryKey: ['vias', zonaId],
  queryFn: async () => {
    if (!zonaId) return [];
    const res = await apiFetch(`vias?zona_id=${zonaId}`);
    return res.data ?? [];
  },
  enabled: !!zonaId,
});


//cargar documentos del propietario seleccionado
const { data: documentos, isLoading: loadingDocs, refetch: refetchDocs} = useQuery({
  queryKey: ['documentos', editItem?.id],
  queryFn: async () => {
    if (!editItem?.id) return [];
    const res = await apiFetch(`documentos/${editItem.id}`);
    //console.log('📂 Documentos cargados:', res); 
    return res; // ✅ tu API devuelve un array directo
  },
  enabled: !!editItem?.id,
});

// ── Eliminar documento ──
const handleDeleteDoc = async (docId: number, nombre: string) => {
  if (!docId) return;

  try {
    await apiFetch(`documentos/${docId}`, { method: 'DELETE' });
    toast.success(`Documento "${nombre}" eliminado`);
    // refresca la lista de documentos
    setSelectedFiles([]);
    refetchDocs();

  } catch (err) {

    toast.error(err instanceof Error ? err.message : 'Error al eliminar documento');
    
  }
};

  const openAdd = () => {
    setEditItem(null);
    reset({ codigo_catastral: '', estado: 'activo' });
    setModalOpen(true);
  };
  

  const openEdit = async (item: Inmueble) => {
    setEditItem(item);
    // 👇 Precargar zonas del municipio ANTES de abrir el modal
  if (item.municipio_id) {
    await queryClient.prefetchQuery({
      queryKey: ['zonas', item.municipio_id],
      queryFn: async () => {
        const res = await apiFetch(`zonas?municipio_id=${item.municipio_id}`);
        return res.data ?? [];
      },
    });
  }

  // 👇 Precargar vías de la zona ANTES de abrir el modal
  if (item.zona_id) {
    await queryClient.prefetchQuery({
      queryKey: ['vias', item.zona_id],
      queryFn: async () => {
        const res = await apiFetch(`vias?zona_id=${item.zona_id}`);
        return res.data ?? [];
      },
    });
  }

  // Transformar polígono GeoJSON a [{lat, lng}, ...]
  /*const poligonoPuntos = item.poligono?.coordinates?.[0]?.map(
    (p: [number, number]) => ({ lat: p[1], lng: p[0] })
  ) ?? [];*/
   
     const poligonoPuntos =
  Array.isArray(item.poligono?.coordinates?.[0])
    ? item.poligono.coordinates[0].map((p: [number, number]) => ({
        lat: p[1],
        lng: p[0],
      }))
    : Array.isArray(item.poligono)
    ? item.poligono // ya está en formato [{lat, lng}]
    : [];
    reset({
      codigo_catastral: item.codigo_catastral,
      propietario_id: item.propietario_id,
      municipio_id: item.municipio_id,
      zona_id: item.zona_id,
      via_id: item.via_id,
      numero_casa: item.numero_casa ?? '',
      colonia: item.colonia ?? '',
      referencia: item.referencia ?? '',
      direccion_completa: item.direccion_completa ?? '',
      tipo: item.tipo,
      uso: item.uso ?? '',
      area_m2: item.area_m2,
      area_registrada: item.area_registrada,
      area_real: item.area_real,
      valor_inscrito: item.valor_inscrito,
      no_inscripcion_iusi: item.no_inscripcion_iusi ?? '',
      finca: item.finca ?? '',
      folio: item.folio ?? '',
      libro: item.libro ?? '',
      departamento_registro: item.departamento_registro ?? '',
      estado: item.estado,
      coordenadas: item.coordenadas,
      lat: item.coordenadas?.coordinates?.[1],
  lng: item.coordenadas?.coordinates?.[0],

  
  poligono_puntos:   poligonoPuntos //item.poligono?.coordinates?.[0] ?? []//  poligonoPuntos
      //lat: item.lat,
      //lng: item.lng,
      //poligono_puntos: item.poligono_puntos,
    /*lat,
    lng,
    poligono_puntos: poligonoPuntos,*/
    });
    setModalOpen(true);
  };

 
   const onSubmit = async (formData: FormData) => {
   setSubmitting(true);
 
   try {
     // Paso 1: Crear o actualizar propietario (JSON)
     const payload = Object.fromEntries(
       Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
     );

         if (formData.poligono_puntos && Array.isArray(formData.poligono_puntos)) {
  const puntos = formData.poligono_puntos as unknown as { lat: number; lng: number }[];
  payload.poligono_puntos = puntos.map(p => [p.lat, p.lng]);
}

     let inmuebleId: number;
 
     if (editItem) {
       const res = await apiFetch(`inmuebles/${editItem.id}`, {
         method: 'PUT',
         body: JSON.stringify(payload),
       });
       inmuebleId = editItem.id; // ya lo tienes
       toast.success('Inmueble actualizado');
        setSelectedFiles([]);
     } else {
       const res = await apiFetch('inmuebles', {
         method: 'POST',
         body: JSON.stringify(payload),
       });
       inmuebleId = res.id; // el backend debe devolver el id del nuevo inmueble
       toast.success('Inmueble creado');
        setSelectedFiles([]);
     }
     //console.log(inmuebleId);
 
     // Paso 2: Subir documentos (FormData)
     if (selectedFiles.length > 0) {
       const docPayload = new FormData();
       docPayload.append('inmueble_id', inmuebleId.toString());
      // 👇 agrega también el propietario_id
      if (payload.propietario_id) {
        docPayload.append('propietario_id', payload.propietario_id.toString());
      }
       selectedFiles.forEach(file => {
         docPayload.append('files', file);
       });
         for (const [key, value] of docPayload.entries()) {
           console.log(key, value);
         }
 
      const doc = await apiUpload('documentos/upload', {
         method: 'POST',
         body: docPayload,
       });
     console.log(doc);
      setSelectedFiles([]);
 
       toast.success('Documentos subidos correctamente');
       refetchDocs(); 
     }
 
     setModalOpen(false);
     refetch();
   } catch (err) {
     toast.error(err instanceof Error ? err.message : 'Error al guardar');
     console.error('Error en onSubmit:', err);
   } finally {
     setSubmitting(false);
   }
 };


  // ── Eliminar ──
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiFetch(`inmuebles/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Inmueble eliminado');
      setDeleteItem(null);
      //fetchData(); // refresca la página actual
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };
      // ── Opciones de selectores ──
const propOptions = [
  { value: '', label: 'Sin propietarios' },
  ...(propietarios ?? []).map(m => ({ value: m.id, label: m.nombre })),
];
  const munOptions = [
  { value: '', label: 'Sin municipio' },
  ...(municipios ?? []).map(m => ({ value: m.id, label: m.nombre })),
];
const zonaOptions = [
  { value: '', label: 'Sin zona' },
  ...(zonas ?? []).map(z => ({ value: z.id, label: `Zona ${z.numero}` })),
];
const viaOptions = [
  { value: '', label: 'Sin vía' },
  ...(vias ?? []).map(v => ({
    value: v.id,
    label: `${v.numero} ${v.tipo_via?.nombre ?? ''} - ${v.nombre ?? ''} ${v.zona?.nombre ?? ''}`.trim(),
  })),
];

// dentro del mismo componente padre
/*
async function handleUploadCertificado(row) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf';
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('inmueble_id', String(row.id));

      // Ajusta la URL a tu endpoint de subida
      const res = await fetch('/api/certificados/upload', {
        method: 'POST',
        body: form,
        // no pongas Content-Type: fetch lo maneja con FormData
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Upload failed', text);
        // muestra notificación de error
        return;
      }

      const json = await res.json();
      // json puede contener { url: '/uploads/..', message: 'ok' }
      console.log('Subida OK', json);
      // opcional: invalidar queryClient para refrescar lista
    } catch (err) {
      console.error('Error subiendo certificado', err);
    }
  };
  input.click();
}*/
async function handleUploadCertificado(row: { id: number }) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf';

  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('inmueble_id', String(row.id));

      // 👇 usa apiUpload en lugar de fetch
      const res = await apiUpload('certificados/upload', {
        method: 'POST',
        body: form,
      });

      console.log('Certificado subido:', res);
      toast.success('Certificado subido correctamente');

      // refresca la lista de certificados/inmuebles
      refetchDocs?.();
      refetch?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir certificado');
      console.error('Error en handleUploadCertificado:', err);
    } finally {
      setSubmitting(false);
    }
  };

  input.click();
}


async function handleUpdateCertificado(certificadoId: number, file: File, inmuebleId: number) {
  setSubmitting(true);
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('inmueble_id', inmuebleId.toString());
    form.append('certificado_id', certificadoId.toString()); // si tu backend lo requiere

    const res = await apiUpload('certificados/upload', {
      method: 'POST', // o 'PUT' si tu backend lo diferencia
      body: form,
    });

    console.log('Certificado actualizado:', res);
    toast.success('Certificado actualizado correctamente');

    // refresca la lista
    refetchDocs?.();
    refetch?.();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al actualizar certificado');
    console.error('Error en handleUpdateCertificado:', err);
  } finally {
    setSubmitting(false);
  }
}


/*function handlePreviewCertificado(row) {
  // Si tu backend expone /api/certificados/:inmuebleId o similar:
  const url = `/api/certificados/${row.id}`; // endpoint que devuelve el PDF (Content-Type: application/pdf)
  //(url);
  setPreviewUrl(url);
  setPreviewOpen(true);
}*/
  /*async function handlePreviewCertificado(certificado: { id: number }) {
    try {
      const res = await apiFetch(`certificados/inmueble/${certificado.id}`, {
        method: 'GET',
      });

      if (!res?.url) {
        toast.error("No hay certificado disponible para este inmueble");
        return;
      }

      setPreviewUrl(res.url);   // URL que viene del backend
      setPreviewOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al obtener certificado');
      console.error('Error en handlePreviewCertificado:', err);
    }
  }*/

async function handlePreviewCertificado(certificado: { id: number }) {
  try {
    const data = await apiFetch(`certificados/inmueble/${certificado.id}`, { method: 'GET' });

    if (Array.isArray(data)) {
      if (data.length === 0) {
        toast.error('No hay certificado disponible para este inmueble');
        return;
      }
      // elegir el más reciente o el primero
      const elegido = data[0];
      if (!elegido?.url) {
        toast.error('No hay URL disponible para el certificado');
        return;
      }
      setPreviewUrl(elegido.url);
      setPreviewOpen(true);
      return;
    }

    // si el backend devuelve un objeto
    if (!data?.url) {
      toast.error('No hay certificado disponible para este inmueble');
      return;
    }
    setPreviewUrl(data.url);
    setPreviewOpen(true);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al obtener certificado');
    console.error('Error en handlePreviewCertificado:', err);
  }
}



/*const geojson = {
  type: "Polygon",
  coordinates: [watch('poligono_puntos').map(p => [p.lng, p.lat])]
};*/

  const columns = [
    { key: 'codigo_catastral', label: 'Código Catastral', render: (row: Inmueble) => <span className="font-mono font-semibold text-[#0f2744] text-xs">{row.codigo_catastral}</span> },
    { key: 'propietario', label: 'Propietario', render: (row: Inmueble) => <span className="text-slate-700">{row.propietario?.nombre ?? '—'}</span> },
    { key: 'tipo', label: 'Tipo', render: (row: Inmueble) => row.tipo ? <StatusBadge value={row.tipo} colorMap={tipoColors} /> : <span className="text-slate-400">—</span> },
    { key: 'area_m2', label: 'Área m²', render: (row: Inmueble) => <span className="text-slate-600">{row.area_m2 ? `${Number(row.area_m2).toLocaleString()} m²` : '—'}</span> },
    { key: 'valor_inscrito', label: 'Valor Inscrito', render: (row: Inmueble) => <span className="text-slate-600">{row.valor_inscrito ? `Q${Number(row.valor_inscrito).toLocaleString()}` : '—'}</span> },
    { key: 'estado', label: 'Estado', render: (row: Inmueble) => <StatusBadge value={row.estado} colorMap={estadoColors} labelMap={estadoLabels} /> },
    { key: 'zona', label: 'Zona', render: (row: Inmueble) => <span className="text-slate-500 text-xs">{row.zona ? `Zona ${row.zona.numero}` : '—'}</span> },
  ];

  //const propOptions = [{ value: '', label: 'Sin propietario' }, ...mockPropietarios.map((p) => ({ value: p.id, label: p.nombre }))];
 // const munOptions = [{ value: '', label: 'Sin municipio' }, ...mockMunicipios.map((m) => ({ value: m.id, label: m.nombre }))];
  //const zonaOptions = [{ value: '', label: 'Sin zona' }, ...mockZonas.map((z) => ({ value: z.id, label: `Zona ${z.numero}` }))];
  //const viaOptions = [{ value: '', label: 'Sin vía' }, ...mockVias.map((v) => ({ value: v.id, label: `${v.tipo_via?.nombre ?? ''} ${v.numero}` }))];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Inmuebles"
        data={data?.data ?? []}  
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        onUploadCertificado={enableCertificados ? handleUploadCertificado  : undefined}
        onPreviewCertificado={enableCertificados ? handlePreviewCertificado : undefined}
        // ahora
        hasCertificado={(row) => !!row.tiene_certificado}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['codigo_catastral', 'colonia', 'no_inscripcion_iusi', 'propietario.nombre']}
        addLabel="Nuevo Inmueble"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Inmueble' : 'Nuevo Inmueble'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Identificación */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Identificación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Código Catastral" required error={errors.codigo_catastral?.message}>
                <Input {...register('codigo_catastral')} error={!!errors.codigo_catastral} placeholder="CAT-2024-001" maxLength={20} />
              </FormField>
              <FormField label="No. Inscripción IUSI">
                <Input {...register('no_inscripcion_iusi')} placeholder="IUSI-001-2024" />
              </FormField>
              <FormField label="Propietario">
                <SearchableSelect
    options={propOptions.filter((o) => o.value !== '')} // quita la opción "Sin propietarios"
    value={watch('propietario_id')}
    onChange={(val) => setValue('propietario_id', val === '' ? undefined : Number(val))}
    placeholder="Buscar propietario..."
  />
              </FormField>
              <FormField label="Estado" required error={errors.estado?.message}>
                <Select {...register('estado')} error={!!errors.estado} options={[
                  { value: 'activo', label: 'Activo' },
                  { value: 'inactivo', label: 'Inactivo' },
                  { value: 'en_disputa', label: 'En Disputa' },
                  { value: 'en_proceso', label: 'En Proceso' },
                ]} />
              </FormField>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Ubicación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Municipio">
                <Select {...register('municipio_id')} options={munOptions} />
              </FormField>
              <FormField label="Zona">
                <Select {...register('zona_id')} options={zonaOptions} />
              </FormField>
              <FormField label="Vía">
                <Select {...register('via_id')} options={viaOptions} />
              </FormField>
              <FormField label="Número de Casa">
                <Input {...register('numero_casa')} placeholder="23" />
              </FormField>
              <FormField label="Colonia">
                <Input {...register('colonia')} placeholder="Centro" />
              </FormField>
              <FormField label="Dirección Completa">
                <Input {...register('direccion_completa')} placeholder="6a Av 1-23 Zona 1, Guatemala" />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Referencia">
                  <Input {...register('referencia')} placeholder="Frente al parque..." />
                </FormField>
              </div>
            </div>
          </div>

          {/* Características */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Características</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Tipo de Inmueble">
                <Select {...register('tipo')} options={[
                  { value: '', label: 'Sin tipo' },
                  { value: 'urbano', label: 'Urbano' },
                  { value: 'rural', label: 'Rural' },
                  { value: 'comercial', label: 'Comercial' },
                  { value: 'industrial', label: 'Industrial' },
                ]} />
              </FormField>
              <FormField label="Uso">
                <Input {...register('uso')} placeholder="Residencial" />
              </FormField>
              <FormField label="Área m² (total)">
                <Input type="number" step="0.01" {...register('area_m2')} placeholder="250.50" />
              </FormField>
              <FormField label="Área Registrada m²">
                <Input type="number" step="0.01" {...register('area_registrada')} placeholder="248.00" />
              </FormField>
              <FormField label="Área Real m²">
                <Input type="number" step="0.01" {...register('area_real')} placeholder="250.50" />
              </FormField>
              <FormField label="Valor Inscrito (Q)">
                <Input type="number" step="0.01" {...register('valor_inscrito')} placeholder="850000" />
              </FormField>
           

            </div>
          </div>

          {/* Registro */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Datos de Registro</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Finca">
                <Input {...register('finca')} placeholder="1234" maxLength={20} />
              </FormField>
              <FormField label="Folio">
                <Input {...register('folio')} placeholder="56" maxLength={20} />
              </FormField>
              <FormField label="Libro">
                <Input {...register('libro')} placeholder="78" maxLength={20} />
              </FormField>
              <FormField label="Departamento de Registro">
                <Input {...register('departamento_registro')} placeholder="Guatemala" />
              </FormField>
              
            </div>
          </div>

          
                    {/* Mapa y ubicación */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Datos Geográficos
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mapa interactivo */}
              <div>
                <MapaUbicacion
                 lat={watch('lat')}
                  lng={watch('lng')}
                  setLatLng={({ lat, lng }) => {
                    setValue('lat', lat);
                    setValue('lng', lng);
                  }}
                />
              </div>
              {/* Inputs de coordenadas */}
              <div className="space-y-4">
                              {/* Botón para obtener ubicación actual */}
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                const { latitude, longitude } = pos.coords;
                                setValue('lat', latitude);
                                setValue('lng', longitude);
                              },
                              (err) => {
                                console.error('Error obteniendo ubicación:', err);
                                alert('No se pudo obtener la ubicación actual.');
                              }
                            );
                          } else {
                            alert('La geolocalización no está soportada en este navegador.');
                          }
                        }}
                        className="px-3 py-2 text-sm bg-[#0f2744] text-white rounded-md hover:bg-[#1a3a5c] transition-all"
                      >
                        Usar mi ubicación actual
                      </button>
                <FormField label="Latitud" error={errors.lat?.message}>
                  <Input
                    type="number"
                    step="any"
                    {...register('lat')}
                    placeholder="14.6279"
                  />
                </FormField>

              

                <FormField label="Longitud" error={errors.lng?.message}>
                  <Input
                    type="number"
                    step="any"
                    {...register('lng')}
                    placeholder="-90.5160"
                  />
                </FormField>
            <FormField label="Coordenadas (GeoJSON)">
              <Input
                value={
                  watch('coordenadas')
                    ? JSON.stringify(watch('coordenadas'))
                    : ''
                }
                readOnly
              />
            </FormField>
            
              </div>
            </div>
          </div>
          
          {/* Mapa y ubicación 2222*/}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Polígono del Inmueble
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mapa interactivo */}
              <div>
              <MapaUbicacionPol
            lat={watch('lat')}
            lng={watch('lng')}
            setLatLng={({ lat, lng }) => {
              setValue('lat', lat);
              setValue('lng', lng);
            }}
            setPoligono={(puntos) => setValue('poligono_puntos', puntos)}
            poligono={watch('poligono_puntos')}   // 👈 pasar polígono inicial
          />
              </div>
              {/* puntos poligonos*/}
            <div className="space-y-4">
            <FormField label="Polígono" error={errors.poligono_puntos?.message}>
            <textarea
              //{...register('poligono_puntos')}
              value={JSON.stringify(watch('poligono_puntos') || [], null, 2) } // 👈 formato legible
              readOnly
              className="w-full p-2 border rounded-md text-xs"
              rows={4}
            />
          </FormField>

    </div>
  </div>
</div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Documentos" loading={loadingDocs}>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.png,.doc,.docx"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  setSelectedFiles(Array.from(files));
                }
              }}
              className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-[#0f2744] file:text-white
                        hover:file:bg-[#1a3a5c]"
            />

                  {/* Vista previa */}
                 {selectedFiles.map((file, i) => (
                            <div
                              key={i}
                              className="relative border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col items-center text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(i)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                                aria-label="Quitar archivo"
                              >
                                ✕
                              </button>
                              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-md shadow-sm mb-2">
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-12 h-12 object-cover rounded-md"
                                  />
                                ) : (
                                  <span className="text-slate-400">📄</span>
                                )}
                              </div>
                              <span className="truncate w-full text-center">{file.name}</span>
                              <span className="text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          ))}
                          {documentos && documentos.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="relative border p-3 rounded-lg bg-slate-50 text-xs flex flex-col items-center"
                >
                  {/* Botón eliminar */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Seguro que quieres eliminar "${doc.nombre}"?`)) {
                        handleDeleteDoc(doc.id, doc.nombre);
                      }
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                    aria-label="Eliminar documento"
                  >
                    ✕
                  </button>

                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.mime_type?.startsWith('image/') ? (
                      <img src={doc.url} alt={doc.nombre} className="w-12 h-12 object-cover rounded-md" />
                    ) : (
                      <span className="text-slate-400">📄</span>
                    )}
                  </a>
                  <span className="truncate w-full text-center">{doc.nombre}</span>
                  <span className="text-slate-400">{(doc.tamano_bytes / 1024).toFixed(1)} KB</span>
                </div>
                    ))}
                  </div>
                )}
                                        
                </FormField>
          </div>





          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all duration-200">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#0f2744] text-white text-sm font-medium rounded-lg hover:bg-[#1a3a5c] transition-all duration-200 hover:scale-105">
              {editItem ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>  

      
       <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Vista previa certificado" size="xl">
        {previewUrl ? (
          <iframe src={previewUrl} className="w-full h-[70vh] border rounded" title="Certificado preview" />
        ) : (
          <p className="text-sm text-slate-500">No hay certificado para mostrar.</p>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Inmueble"
        message={`¿Estás seguro de eliminar el inmueble "${deleteItem?.codigo_catastral}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />

       {/* 👇 Overlay de carga */}
      {submitting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-10 h-10 border-4 border-[#0f2744]/20 border-t-[#0f2744] rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Cargando, por favor espera...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}