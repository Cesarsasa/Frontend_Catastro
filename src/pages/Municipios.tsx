import React, { useState, useEffect} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select } from '../components/FormField';
import { mockMunicipios, mockDepartamentos } from '../lib/mockData';
import type { Municipio } from '../types';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  departamento_id: z.coerce.number().min(1, 'Selecciona un departamento'),
  codigo: z.string().min(1, 'Requerido').max(10),
  nombre: z.string().min(1, 'Requerido').max(100),
});
type FormData = z.infer<typeof schema>;

export default function Municipios() {
  const { user, apiFetch } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  //const [data, setData] = useState<Municipio[]>(mockMunicipios);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Municipio | null>(null);
  const [deleteItem, setDeleteItem] = useState<Municipio | null>(null);
  const queryClient = useQueryClient();
  const [page, setPage]                     = useState(1);
  const [search, setSearch]                 = useState('');
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

      // ── Municipios API
      const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['municipios', page, debouncedSearch],
        queryFn: async () => {
          const params = new URLSearchParams({
            page: String(page),
            limit: '20',
            ...(debouncedSearch && { buscar: debouncedSearch }),
          });
          return apiFetch(`municipios?${params}`);
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60,
      });
// ── departamentos ──
const { data: departamentos = [] } = useQuery({
  queryKey: ['departamentos'],
  queryFn: async () => {
    const res = await apiFetch('departamentos');
    return res.data ?? [];
  },
});

// ── opciones para el select ──
const depOptions = [
  { value: '', label: 'Sin departamento' },
  ...departamentos.map(dep => ({
    value: dep.id,
    label: dep.nombre, // 👈 solo el nombre del departamento
  })),
];



  const openAdd = () => { setEditItem(null); reset({ departamento_id: 0, codigo: '', nombre: '' }); setModalOpen(true); };
  const openEdit = (item: Municipio) => { setEditItem(item); reset({ departamento_id: item.departamento_id, codigo: item.codigo, nombre: item.nombre }); setModalOpen(true); };

  const onSubmit = async(formData: FormData) => {
    try{
      const payload = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])

      );
      let municipioId: number | null = null;

            if (editItem) {
          const res = await apiFetch(`municipios/${editItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          municipioId = editItem.id;
            toast.success('Municipio  actualizado');
          } else {
            const res = await apiFetch('municipios', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            municipioId = res.id;
            toast.success('Municipio creado', municipioId ? { autoClose: 2000 } : undefined);
          }
          setModalOpen(false);
          refetch();
}  catch (err: any) {
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
      await apiFetch(`municipios/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Municipio eliminado');
      setDeleteItem(null);
      //fetchData(); // refresca la página actual
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };
    // ── Opciones de selectores ──
 /* const depOptions= [
  { value: '', label: 'Sin departamento' },
  ...(departamentos ?? []).map(m => ({ value: m.id, label: m.departamento.nombre })),
];*/


  const columns = [
    { key: 'id', label: 'ID', render: (row: Municipio) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'codigo', label: 'Código', render: (row: Municipio) => <span className="font-mono font-medium text-[#0f2744]">{row.codigo}</span> },
    { key: 'nombre', label: 'Nombre' },
    { key: 'departamento', label: 'Departamento', render: (row: Municipio) => <span className="text-slate-600">{row.departamento?.nombre ?? '—'}</span> },
    { key: 'creado_en', label: 'Creado', render: (row: Municipio) => <span className="text-slate-400 text-xs">{new Date(row.creado_en).toLocaleDateString('es-GT')}</span> },
  ];

  //const depOptions = mockDepartamentos.map((d) => ({ value: d.id, label: d.nombre }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      
      <DataTable
        title="Municipios"
          data={data?.data ?? []} 
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['codigo', 'nombre']}
        addLabel="Nuevo Municipio"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Municipio' : 'Nuevo Municipio'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Departamento" required error={errors.departamento_id?.message}>
            <Select {...register('departamento_id')} error={!!errors.departamento_id} options={depOptions} placeholder="Seleccionar departamento" />
          </FormField>
          <FormField label="Código" required error={errors.codigo?.message}>
            <Input {...register('codigo')} error={!!errors.codigo} placeholder="MUN01" maxLength={10} />
          </FormField>
          <FormField label="Nombre" required error={errors.nombre?.message}>
            <Input {...register('nombre')} error={!!errors.nombre} placeholder="Guatemala Ciudad" maxLength={100} />
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
        title="Eliminar Municipio"
        message={`¿Estás seguro de eliminar el municipio "${deleteItem?.nombre}"?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}