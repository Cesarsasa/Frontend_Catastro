import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select, Textarea } from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import type { Propietario } from '../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  tipo: z.enum(['persona', 'empresa']),
  nombre: z.string().min(1, 'Requerido').max(200),
  dpi: z.string().optional(),
  nit: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  municipio_id: z.coerce.number().optional(),
  zona_id: z.coerce.number().optional(),
  via_id: z.coerce.number().optional(),
  numero_casa: z.string().optional(),
  colonia: z.string().optional(),
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ─── Tipos para selectores ─────────────────────────────────────────────────────
/*interface Municipio { id: number; nombre: string; }
interface Zona { id: number; numero: number; nombre: string; }
interface Via { id: number; nombre?: string; numero: string; tipo_via?: { nombre: string }; zona?: { nombre: string }; }*/

const tipoBadge: Record<string, string> = {
  persona: 'bg-blue-100 text-blue-700',
  empresa: 'bg-purple-100 text-purple-700',
};

// ─── Página ────────────────────────────────────────────────────────────────────
export default function Propietarios() {
  const { user, apiFetch, apiUpload } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  const canDelete = user?.rol === 'admin';
  const queryClient = useQueryClient(); 
  // ── Estado principal ──
 // const [data, setData]           = useState<Propietario[]>([]);
 // const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editItem, setEditItem]   = useState<Propietario | null>(null);
  const [deleteItem, setDeleteItem] = useState<Propietario | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Paginación y búsqueda ──
  const [page, setPage]                     = useState(1);
//  const [pages, setPages]                   = useState(1);
 // const [total, setTotal]                   = useState(0);
  const [search, setSearch]                 = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Selectores (descomenta cuando tengas los endpoints) ──
  /*const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [zonas, setZonas]           = useState<Zona[]>([]);
  const [vias, setVias]             = useState<Via[]>([]);*/

  const { register, handleSubmit, watch,reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'persona' },
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

 
// ── Propietarios ──
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['propietarios', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(debouncedSearch && { buscar: debouncedSearch }),
    });
    return apiFetch(`propietarios?${params}`);
  },
  placeholderData: (prev) => prev,
  staleTime: 1000 * 60,
});

// ── Municipios ──
const { data: municipios } = useQuery({
  queryKey: ['municipios'],
  queryFn: async () => {
    const res = await apiFetch('municipios');
    return res.data ?? [];
  },
});

// ── Zonas ──
const municipioId = watch('municipio_id');
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
    const res = await apiFetch(`documentos-propietarios/${editItem.id}`);
    //console.log('📂 Documentos cargados:', res); 
    return res; // ✅ tu API devuelve un array directo
  },
  enabled: !!editItem?.id,
});

// ── Eliminar documento ──
const handleDeleteDoc = async (docId: number, nombre: string) => {
  if (!docId) return;

  try {
    await apiFetch(`documentos-propietarios/${docId}`, { method: 'DELETE' });
    toast.success(`Documento "${nombre}" eliminado`);
    // refresca la lista de documentos
    setSelectedFiles([]);
    refetchDocs();

  } catch (err) {

    toast.error(err instanceof Error ? err.message : 'Error al eliminar documento');
    
  }
};
  // ── Abrir modal crear ──
  const openAdd = () => {
    setEditItem(null);
    reset({
      tipo: 'persona', nombre: '', dpi: '', nit: '',
      telefono: '', email: '', direccion: '',
      numero_casa: '', colonia: '', referencia: '', observaciones: '',
    });
    setModalOpen(true);
  };

  // ── Abrir modal editar ──
  const openEdit = async (item: Propietario) => {

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

    reset({
      tipo:        item.tipo,
      nombre:      item.nombre,
      dpi:         item.dpi         ?? '',
      nit:         item.nit         ?? '',
      telefono:    item.telefono    ?? '',
      email:       item.email       ?? '',
      direccion:   item.direccion   ?? '',
      municipio_id: item.municipio_id,
      zona_id:     item.zona_id,
      via_id:      item.via_id,
      numero_casa: item.numero_casa ?? '',
      colonia:     item.colonia     ?? '',
      referencia:  item.referencia  ?? '',
      observaciones: item.observaciones ?? '',
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

    let propietarioId: number;

    if (editItem) {
      const res = await apiFetch(`propietarios/${editItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      propietarioId = editItem.id; // ya lo tienes
      toast.success('Propietario actualizado');
       setSelectedFiles([]);
    } else {
      const res = await apiFetch('propietarios', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      propietarioId = res.id; // el backend debe devolver el id del nuevo propietario
      toast.success('Propietario creado');
       setSelectedFiles([]);
    }
    //console.log(propietarioId);

    // Paso 2: Subir documentos (FormData)
    if (selectedFiles.length > 0) {
      const docPayload = new FormData();
      docPayload.append('propietario_id', propietarioId.toString());

      selectedFiles.forEach(file => {
        docPayload.append('files', file);
      });
        for (const [key, value] of docPayload.entries()) {
          console.log(key, value);
        }

     const doc = await apiUpload('documentos-propietarios/upload', {
        method: 'POST',
        body: docPayload,
      });
    // console.log(doc);
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
      await apiFetch(`propietarios/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Propietario eliminado');
      setDeleteItem(null);
      //fetchData(); // refresca la página actual
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };
    // ── Opciones de selectores ──
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

  // ── Columnas ──
  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row: Propietario) => (
        <span className="text-slate-400 text-xs font-mono">#{row.id}</span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row: Propietario) => (
        <StatusBadge value={row.tipo} colorMap={tipoBadge} />
      ),
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (row: Propietario) => (
        <span className="font-medium text-slate-800">{row.nombre}</span>
      ),
    },
    {
      key: 'dpi',
      label: 'DPI',
      render: (row: Propietario) => (
        <span className="font-mono text-xs text-slate-500">{row.dpi ?? '—'}</span>
      ),
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (row: Propietario) => (
        <span className="text-slate-600">{row.telefono ?? '—'}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row: Propietario) => (
        <span className="text-slate-500 text-xs">{row.email ?? '—'}</span>
      ),
    },
    {
      key: 'municipio',
      label: 'Municipio',
      render: (row: Propietario) => (
        <span className="text-slate-500 text-xs">{row.municipio?.nombre ?? '—'}</span>
      ),
    },
    {
      key: 'zona',
      label: 'Zona',
      render: (row: Propietario) => (
        <span className="text-slate-500 text-xs">
          {row.zona?.nombre ?? (row.zona_id ? `Zona ${row.zona_id}` : '—')}
        </span>
      ),
    },
  ];

    if (isLoading) return <p>Cargando...</p>;
  if (error) return <p>Error al cargar</p>;



  /*// ── Opciones de selectores ──
  const munOptions = [
    { value: '', label: 'Sin municipio' },
    ...municipios.map(m => ({ value: m.id, label: m.nombre })),
  ];
  const zonaOptions = [
    { value: '', label: 'Sin zona' },
    ...zonas.map(z => ({ value: z.id, label: `Zona ${z.numero}` })),
  ];
  const viaOptions = [
    { value: '', label: 'Sin vía' },
    ...vias.map(v => ({
      value: v.id,
      label: `${v.numero} ${v.tipo_via?.nombre ?? ''} - ${v.nombre ?? ''}  ${v.zona?.nombre ?? ''}`.trim(),
    })),
  ];*/


  // ────────────────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 animate-pulse">
          <div className="h-6 w-48 bg-slate-100 rounded-lg" />
          <div className="h-4 w-32 bg-slate-100 rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <DataTable
            title="Propietarios"
           // data={data}
            data={data?.data ?? []}  
            columns={columns}
            onAdd={canWrite ? openAdd : undefined}
            onEdit={canWrite ? openEdit : undefined}
            onDelete={canDelete ? setDeleteItem : undefined}
            canAdd={canWrite}
            canEdit={canWrite}
            canDelete={canDelete}
            searchKeys={['nombre', 'dpi', 'nit', 'email']}
            addLabel="Nuevo Propietario"
            // — búsqueda controlada desde aquí —
            searchValue={search}
            onSearchChange={setSearch}
          />

        </>
      )}

      {/* ── Modal Crear / Editar ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {setModalOpen(false); setSelectedFiles([]);}}
        title={editItem ? 'Editar Propietario' : 'Nuevo Propietario'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Información General
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Tipo" required>
                <Select
                  {...register('tipo')}
                  options={[
                    { value: 'persona', label: 'Persona Natural' },
                    { value: 'empresa', label: 'Empresa / Jurídico' },
                  ]}
                />
              </FormField>
              <FormField label="Nombre Completo / Razón Social" required error={errors.nombre?.message}>
                <Input {...register('nombre')} error={!!errors.nombre} placeholder="Carlos Mendoza López" />
              </FormField>
              <FormField label="DPI" error={errors.dpi?.message}>
                <Input {...register('dpi')} placeholder="1234567890101" maxLength={20} />
              </FormField>
              <FormField label="NIT" error={errors.nit?.message}>
                <Input {...register('nit')} placeholder="12345678" maxLength={20} />
              </FormField>
              <FormField label="Teléfono">
                <Input {...register('telefono')} placeholder="55551234" maxLength={20} />
              </FormField>
              <FormField label="Email" error={errors.email?.message}>
                <Input type="email" {...register('email')} error={!!errors.email} placeholder="correo@ejemplo.com" />
              </FormField>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Dirección
            </p>
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
                <Input {...register('numero_casa')} placeholder="23" maxLength={20} />
              </FormField>
              <FormField label="Colonia / Residencial">
                <Input {...register('colonia')} placeholder="Centro" maxLength={100} />
              </FormField>
              <FormField label="Dirección Completa">
                <Input {...register('direccion')} placeholder="6a Av 1-23 Zona 1" />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Referencia">
              <Textarea {...register('referencia')} placeholder="Frente al parque..." rows={2} />
            </FormField>
            <FormField label="Observaciones">
              <Textarea {...register('observaciones')} placeholder="Notas adicionales..." rows={2} />
            </FormField>
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
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-[#0f2744] text-white text-sm font-medium rounded-lg hover:bg-[#1a3a5c] transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editItem ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                editItem ? 'Actualizar' : 'Crear'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Eliminar ── */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Propietario"
        message={`¿Estás seguro de eliminar al propietario "${deleteItem?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}/*import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select, Textarea } from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import { mockPropietarios, mockMunicipios, mockZonas, mockVias } from '../lib/mockData';
import type { Propietario } from '../types';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  tipo: z.enum(['persona', 'empresa']),
  nombre: z.string().min(1, 'Requerido').max(200),
  dpi: z.string().optional(),
  nit: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  municipio_id: z.coerce.number().optional(),
  zona_id: z.coerce.number().optional(),
  via_id: z.coerce.number().optional(),
  numero_casa: z.string().optional(),
  colonia: z.string().optional(),
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const tipoBadge: Record<string, string> = {
  persona: 'bg-blue-100 text-blue-700',
  empresa: 'bg-purple-100 text-purple-700',
};

export default function Propietarios() {
  const { user } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  const [data, setData] = useState<Propietario[]>(mockPropietarios);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Propietario | null>(null);
  const [deleteItem, setDeleteItem] = useState<Propietario | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'persona' },
  });

  const openAdd = () => {
    setEditItem(null);
    reset({ tipo: 'persona', nombre: '', dpi: '', nit: '', telefono: '', email: '', direccion: '', numero_casa: '', colonia: '', referencia: '', observaciones: '' });
    setModalOpen(true);
  };

  const openEdit = (item: Propietario) => {
    setEditItem(item);
    reset({ tipo: item.tipo, nombre: item.nombre, dpi: item.dpi ?? '', nit: item.nit ?? '', telefono: item.telefono ?? '', email: item.email ?? '', direccion: item.direccion ?? '', municipio_id: item.municipio_id, zona_id: item.zona_id, via_id: item.via_id, numero_casa: item.numero_casa ?? '', colonia: item.colonia ?? '', referencia: item.referencia ?? '', observaciones: item.observaciones ?? '' });
    setModalOpen(true);
  };

  const onSubmit = (formData: FormData) => {
    const mun = mockMunicipios.find((m) => m.id === formData.municipio_id);
    const zona = mockZonas.find((z) => z.id === formData.zona_id);
    const via = mockVias.find((v) => v.id === formData.via_id);
    const now = new Date().toISOString();
    if (editItem) {
      setData((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...formData, municipio: mun, zona, via, actualizado_en: now } : d));
      toast.success('Propietario actualizado');
    } else {
      const newItem: Propietario = { id: Date.now(), tipo: formData.tipo, nombre: formData.nombre, dpi: formData.dpi, nit: formData.nit, telefono: formData.telefono, email: formData.email, direccion: formData.direccion, municipio_id: formData.municipio_id, zona_id: formData.zona_id, via_id: formData.via_id, numero_casa: formData.numero_casa, colonia: formData.colonia, referencia: formData.referencia, observaciones: formData.observaciones, creado_en: now, actualizado_en: now, municipio: mun, zona, via };
      setData((prev) => [...prev, newItem]);
      toast.success('Propietario creado');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData((prev) => prev.filter((d) => d.id !== deleteItem.id));
    toast.success('Propietario eliminado');
    setDeleteItem(null);
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: Propietario) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'tipo', label: 'Tipo', render: (row: Propietario) => <StatusBadge value={row.tipo} colorMap={tipoBadge} /> },
    { key: 'nombre', label: 'Nombre', render: (row: Propietario) => <span className="font-medium text-slate-800">{row.nombre}</span> },
    { key: 'dpi', label: 'DPI', render: (row: Propietario) => <span className="font-mono text-xs text-slate-500">{row.dpi ?? '—'}</span> },
    { key: 'telefono', label: 'Teléfono', render: (row: Propietario) => <span className="text-slate-600">{row.telefono ?? '—'}</span> },
    { key: 'email', label: 'Email', render: (row: Propietario) => <span className="text-slate-500 text-xs">{row.email ?? '—'}</span> },
    { key: 'municipio', label: 'Municipio', render: (row: Propietario) => <span className="text-slate-500 text-xs">{row.municipio?.nombre ?? '—'}</span> },
  ];

  const munOptions = [{ value: '', label: 'Sin municipio' }, ...mockMunicipios.map((m) => ({ value: m.id, label: m.nombre }))];
  const zonaOptions = [{ value: '', label: 'Sin zona' }, ...mockZonas.map((z) => ({ value: z.id, label: `Zona ${z.numero}` }))];
  const viaOptions = [{ value: '', label: 'Sin vía' }, ...mockVias.map((v) => ({ value: v.id, label: `${v.tipo_via?.nombre ?? ''} ${v.numero} — ${v.nombre ?? ''}` }))];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Propietarios"
        data={data}
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['nombre', 'dpi', 'nit', 'email']}
        addLabel="Nuevo Propietario"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Propietario' : 'Nuevo Propietario'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Información General</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Tipo" required>
                <Select {...register('tipo')} options={[{ value: 'persona', label: 'Persona Natural' }, { value: 'empresa', label: 'Empresa / Jurídico' }]} />
              </FormField>
              <FormField label="Nombre Completo / Razón Social" required error={errors.nombre?.message}>
                <Input {...register('nombre')} error={!!errors.nombre} placeholder="Carlos Mendoza López" />
              </FormField>
              <FormField label="DPI" error={errors.dpi?.message}>
                <Input {...register('dpi')} placeholder="1234567890101" maxLength={20} />
              </FormField>
              <FormField label="NIT" error={errors.nit?.message}>
                <Input {...register('nit')} placeholder="12345678" maxLength={20} />
              </FormField>
              <FormField label="Teléfono" error={errors.telefono?.message}>
                <Input {...register('telefono')} placeholder="55551234" maxLength={20} />
              </FormField>
              <FormField label="Email" error={errors.email?.message}>
                <Input type="email" {...register('email')} error={!!errors.email} placeholder="correo@ejemplo.com" />
              </FormField>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Dirección</p>
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
                <Input {...register('numero_casa')} placeholder="23" maxLength={20} />
              </FormField>
              <FormField label="Colonia / Residencial">
                <Input {...register('colonia')} placeholder="Centro" maxLength={100} />
              </FormField>
              <FormField label="Dirección Completa">
                <Input {...register('direccion')} placeholder="6a Av 1-23 Zona 1" />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Referencia">
              <Textarea {...register('referencia')} placeholder="Frente al parque..." rows={2} />
            </FormField>
            <FormField label="Observaciones">
              <Textarea {...register('observaciones')} placeholder="Notas adicionales..." rows={2} />
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

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Propietario"
        message={`¿Estás seguro de eliminar al propietario "${deleteItem?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}*/