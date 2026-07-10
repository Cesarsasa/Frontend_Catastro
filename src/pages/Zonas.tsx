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
import { mockZonas, mockMunicipios } from '../lib/mockData';
import type { Zona } from '../types';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


const schema = z.object({
  municipio_id: z.coerce.number().min(1, 'Selecciona un municipio'),
  numero: z.coerce.number().min(1, 'Requerido'),
  nombre: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Zonas() {
  const { user, apiFetch} = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  //const [data, setData] = useState<Zona[]>(mockZonas);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Zona | null>(null);
  const [deleteItem, setDeleteItem] = useState<Zona | null>(null);
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
  

    // ── zONAS API
          const { data, isLoading, error, refetch } = useQuery({
            queryKey: ['zonas', page, debouncedSearch],
            queryFn: async () => {
              const params = new URLSearchParams({
                page: String(page),
                limit: '20',
                ...(debouncedSearch && { buscar: debouncedSearch }),
              });
              return apiFetch(`zonas?${params}`);
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
          //selectores
          const munOptions = [
          { value: '', label: 'Sin municipios' },
          ...municipios.map(dep => ({
            value: dep.id,
            label: dep.nombre, // 👈 solo el nombre del departamento
          })),
];

  const openAdd = () => { setEditItem(null); reset({ municipio_id: 0, numero: 1, nombre: '' }); setModalOpen(true); };
  const openEdit = (item: Zona) => { setEditItem(item); reset({ municipio_id: item.municipio_id, numero: item.numero, nombre: item.nombre ?? '' }); setModalOpen(true); };

   const onSubmit = async(formData: FormData) => {
      try{
        const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
  
        );
        let zonaId: number | null = null;
  
              if (editItem) {
            const res = await apiFetch(`zonas/${editItem.id}`, {
              method: 'PUT',
              body: JSON.stringify(payload),
            });
           zonaId = editItem.id;
              toast.success('Zona  actualizada');
            } else {
              const res = await apiFetch('zonas', {
                method: 'POST',
                body: JSON.stringify(payload),
              });
              zonaId = res.id;
              toast.success('Zona creada', zonaId ? { autoClose: 2000 } : undefined);
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
      await apiFetch(`zonas/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Zona eliminada');
      setDeleteItem(null);
      //fetchData(); // refresca la página actual
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: Zona) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'numero', label: 'Número', render: (row: Zona) => <span className="font-semibold text-[#0f2744]">Zona {row.numero}</span> },
    { key: 'nombre', label: 'Nombre', render: (row: Zona) => <span>{row.nombre ?? '—'}</span> },
    { key: 'municipio', label: 'Municipio', render: (row: Zona) => <span className="text-slate-600">{row.municipio?.nombre ?? '—'}</span> },
    { key: 'creado_en', label: 'Creado', render: (row: Zona) => <span className="text-slate-400 text-xs">{new Date(row.creado_en).toLocaleDateString('es-GT')}</span> },
  ];

  //const munOptions = mockMunicipios.map((m) => ({ value: m.id, label: m.nombre }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Zonas"
      //  data={data}
          data={data?.data ?? []} 
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['nombre']}
        addLabel="Nueva Zona"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Zona' : 'Nueva Zona'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Municipio" required error={errors.municipio_id?.message}>
            <Select {...register('municipio_id')} error={!!errors.municipio_id} options={munOptions} placeholder="Seleccionar municipio" />
          </FormField>
          <FormField label="Número de Zona" required error={errors.numero?.message}>
            <Input type="number" {...register('numero')} error={!!errors.numero} placeholder="1" min={1} />
          </FormField>
          <FormField label="Nombre (opcional)" error={errors.nombre?.message}>
            <Input {...register('nombre')} placeholder="Centro Histórico" maxLength={100} />
          </FormField>
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
        title="Eliminar Zona"
        message={`¿Estás seguro de eliminar la Zona ${deleteItem?.numero}?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}