import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select } from '../components/FormField';
import { mockVias, mockMunicipios, mockZonas, mockTiposVia } from '../lib/mockData';
import type { Via } from '../types';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  municipio_id: z.coerce.number().min(1, 'Requerido'),
  zona_id: z.coerce.number().optional(),
  tipo_via_id: z.coerce.number().min(1, 'Requerido'),
  numero: z.string().min(1, 'Requerido').max(10),
  nombre: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Vias() {
  const { user, apiFetch } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  //const [data, setData] = useState<Via[]>(mockVias);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Via | null>(null);
  const [deleteItem, setDeleteItem] = useState<Via | null>(null);
  const [search, setSearch]                 = useState('');
       const [page, setPage]                     = useState(1);
      const [debouncedSearch, setDebouncedSearch] = useState('');
        const [submitting, setSubmitting] = useState(false);
        
// ── Debounce: espera 300ms después de que el usuario deja de escribir ──
      useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
      }, [search]);
    
      // ── Cuando cambia la búsqueda, volver a página 1 ──
      useEffect(() => { setPage(1); }, [debouncedSearch]);
  
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
      resolver: zodResolver(schema),
    });

        // ── Vias API
              const { data, isLoading, error, refetch } = useQuery({
                queryKey: ['vias', page, debouncedSearch],
                queryFn: async () => {
                  const params = new URLSearchParams({
                    page: String(page),
                    limit: '20',
                    ...(debouncedSearch && { buscar: debouncedSearch }),
                  });
                  return apiFetch(`vias?${params}`);
                },
                placeholderData: (prev) => prev,
                staleTime: 1000 * 60,
              });
             //get municipio
              const { data: municipios = [] } = useQuery({
                queryKey: ['municipios'],
                queryFn: async () => {
                  const res = await apiFetch('municipios');
                  return res.data ?? [];
                },
              });
              //get zonas
              const { data: zonas = [] } = useQuery({
                queryKey: ['zonas'],
                queryFn: async () => {
                  const res = await apiFetch('zonas');
                  return res.data ?? [];
                },
              });
                  //get tipos de via
              const { data: tiposVia = [] } = useQuery({
                queryKey: ['tipos-via'],
                queryFn: async () => {
                  const res = await apiFetch('tipos-via');
                  return res.data ?? [];
                },
              });
              //selectores
              const munOptions = [
              { value: '', label: 'Sin municipios' },
              ...municipios.map(dep => ({
                value: dep.id,
                label: dep.nombre, // 👈 solo el nombre del departamento
              })),
    ];
       const zonaOptions = [
              { value: '', label: 'Sin zonas' },
              ...zonas.map(dep => ({
                value: dep.id,
                label: dep.nombre, // 👈 solo el nombre del departamento
              })),
    ];
     const tipoOptions = [
              { value: '', label: 'Sin tipos de via' },
              ...tiposVia.map(dep => ({
                value: dep.id,
                label: dep.nombre, // 👈 solo el nombre del departamento
              })),
    ];
  
  
  const openAdd = () => { setEditItem(null); reset({ municipio_id: 0, zona_id: undefined, tipo_via_id: 0, numero: '', nombre: '' }); setModalOpen(true); };
  const openEdit = (item: Via) => {
    setEditItem(item);
    reset({ municipio_id: item.municipio_id, zona_id: item.zona_id, tipo_via_id: item.tipo_via_id, numero: item.numero, nombre: item.nombre ?? '' });
    setModalOpen(true);
  };

    const onSubmit = async(formData: FormData) => {
        try{
          const payload = Object.fromEntries(
          Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
    
          );
          let zonaId: number | null = null;
    
                if (editItem) {
              const res = await apiFetch(`vias/${editItem.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
              });
             zonaId = editItem.id;
                toast.success('Vía actualizada');
              } else {
                const res = await apiFetch('vias', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                });
                zonaId = res.id;
                toast.success('Vía creada', zonaId ? { autoClose: 2000 } : undefined);
              }
              setModalOpen(false);
              refetch();
    } catch (err: any) {
        if (err.message.includes('Ya existe una zona')) {
      //toast.error('Ya existe una zona con ese número en el municipio');
       toast.error(err.message);
    } else {
      //toast.error('Error al guardar la zona');
       toast.error(err.message || 'Error al guardar la zona');
    }
        } finally {
           setSubmitting(false);
      }
    };

 const handleDelete = async () => {
    if (!deleteItem) return;
 try {
      await apiFetch(`vias/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Vía eliminada');
      setDeleteItem(null);
      //fetchData(); // refresca la página actual
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: Via) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'tipo_via', label: 'Tipo', render: (row: Via) => <span className="text-slate-600">{row.tipo_via?.nombre ?? '—'}</span> },
    { key: 'numero', label: 'Número', render: (row: Via) => <span className="font-mono font-medium text-[#0f2744]">{row.numero}</span> },
    { key: 'nombre', label: 'Nombre', render: (row: Via) => <span>{row.nombre ?? '—'}</span> },
    { key: 'zona', label: 'Zona', render: (row: Via) => <span className="text-slate-500 text-xs">{row.zona ? `Zona ${row.zona.numero}` : '—'}</span> },
    { key: 'municipio', label: 'Municipio', render: (row: Via) => <span className="text-slate-600">{row.municipio?.nombre ?? '—'}</span> },
  ];

  //const munOptions = mockMunicipios.map((m) => ({ value: m.id, label: m.nombre }));
  //const zonaOptions = [{ value: '', label: 'Sin zona' }, ...mockZonas.map((z) => ({ value: z.id, label: `Zona ${z.numero} — ${z.nombre ?? ''}` }))];
 // const tipoOptions = mockTiposVia.map((t) => ({ value: t.id, label: t.nombre }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Vías"
        //data={data}
        data = {data?.data ?? []}
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['numero', 'nombre']}
        addLabel="Nueva Vía"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Vía' : 'Nueva Vía'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Municipio" required error={errors.municipio_id?.message}>
            <Select {...register('municipio_id')} error={!!errors.municipio_id} options={munOptions} placeholder="Seleccionar" />
          </FormField>
          <FormField label="Zona" error={errors.zona_id?.message}>
            <Select {...register('zona_id')} options={zonaOptions} />
          </FormField>
          <FormField label="Tipo de Vía" required error={errors.tipo_via_id?.message}>
            <Select {...register('tipo_via_id')} error={!!errors.tipo_via_id} options={tipoOptions} placeholder="Seleccionar" />
          </FormField>
          <FormField label="Número" required error={errors.numero?.message}>
            <Input {...register('numero')} error={!!errors.numero} placeholder="6" maxLength={10} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Nombre (opcional)" error={errors.nombre?.message}>
              <Input {...register('nombre')} placeholder="6a Avenida" maxLength={100} />
            </FormField>
          </div>
          <div className="sm:col-span-2 flex gap-3 pt-2">
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
        title="Eliminar Vía"
        message={`¿Estás seguro de eliminar la vía "${deleteItem?.nombre ?? deleteItem?.numero}"?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}