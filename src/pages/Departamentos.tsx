import React, { useState , useEffect} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input } from '../components/FormField';
import { mockDepartamentos } from '../lib/mockData';
import type { Departamento } from '../types';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  codigo: z.string().min(1, 'Requerido').max(10, 'Máximo 10 caracteres'),
  nombre: z.string().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function Departamentos() {
  const { user, apiFetch} = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Departamento | null>(null);
  const [deleteItem, setDeleteItem] = useState<Departamento | null>(null);
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
  
        // ── Departamentos API
        const { data, isLoading, error, refetch } = useQuery({
          queryKey: ['departamentos', page, debouncedSearch],
          queryFn: async () => {
            const params = new URLSearchParams({
              page: String(page),
              limit: '20',
              ...(debouncedSearch && { buscar: debouncedSearch }),
            });
            return apiFetch(`departamentos?${params}`);
          },
          placeholderData: (prev) => prev,
          staleTime: 1000 * 60,
        });

  const openAdd = () => { setEditItem(null); reset({ codigo: '', nombre: '' }); setModalOpen(true); };
  const openEdit = (item: Departamento) => { setEditItem(item); reset({ codigo: item.codigo, nombre: item.nombre }); setModalOpen(true); };

  const onSubmit = (formData: FormData) => {
    if (editItem) {
      setData((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...formData } : d));
      toast.success('Departamento actualizado');
    } else {
      const newItem: Departamento = { id: Date.now(), ...formData, creado_en: new Date().toISOString() };
      setData((prev) => [...prev, newItem]);
      toast.success('Departamento creado');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData((prev) => prev.filter((d) => d.id !== deleteItem.id));
    toast.success('Departamento eliminado');
    setDeleteItem(null);
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: Departamento) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'codigo', label: 'Código', render: (row: Departamento) => <span className="font-mono font-medium text-[#0f2744]">{row.codigo}</span> },
    { key: 'nombre', label: 'Nombre' },
    { key: 'creado_en', label: 'Creado', render: (row: Departamento) => <span className="text-slate-400 text-xs">{new Date(row.creado_en).toLocaleDateString('es-GT')}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Departamentos"
        data={data?.data ?? []} 
        columns={columns}
        //onAdd={canWrite ? openAdd : undefined}
       // onEdit={canWrite ? openEdit : undefined}
       // onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite} 
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['codigo', 'nombre']}
        addLabel="Nuevo Departamento"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Departamento' : 'Nuevo Departamento'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Código" required error={errors.codigo?.message}>
            <Input {...register('codigo')} error={!!errors.codigo} placeholder="GT01" maxLength={10} />
          </FormField>
          <FormField label="Nombre" required error={errors.nombre?.message}>
            <Input {...register('nombre')} error={!!errors.nombre} placeholder="Guatemala" maxLength={100} />
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
        title="Eliminar Departamento"
        message={`¿Estás seguro de eliminar el departamento "${deleteItem?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}