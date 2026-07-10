import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input } from '../components/FormField';
import { mockTiposVia } from '../lib/mockData';
import type { TipoVia } from '../types';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function TiposVia() {
  const { user } = useAuthStore();
  const canWrite = user?.rol === 'admin';
  const [data, setData] = useState<TipoVia[]>(mockTiposVia);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TipoVia | null>(null);
  const [deleteItem, setDeleteItem] = useState<TipoVia | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openAdd = () => { setEditItem(null); reset({ nombre: '' }); setModalOpen(true); };
  const openEdit = (item: TipoVia) => { setEditItem(item); reset({ nombre: item.nombre }); setModalOpen(true); };

  const onSubmit = (formData: FormData) => {
    if (editItem) {
      setData((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...formData } : d));
      toast.success('Tipo de vía actualizado');
    } else {
      setData((prev) => [...prev, { id: Date.now(), ...formData }]);
      toast.success('Tipo de vía creado');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData((prev) => prev.filter((d) => d.id !== deleteItem.id));
    toast.success('Tipo de vía eliminado');
    setDeleteItem(null);
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: TipoVia) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'nombre', label: 'Nombre', render: (row: TipoVia) => <span className="font-medium text-slate-800">{row.nombre}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Tipos de Vía"
        data={data}
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['nombre']}
        addLabel="Nuevo Tipo"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Tipo de Vía' : 'Nuevo Tipo de Vía'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Nombre" required error={errors.nombre?.message}>
            <Input {...register('nombre')} error={!!errors.nombre} placeholder="Avenida" maxLength={50} />
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
        title="Eliminar Tipo de Vía"
        message={`¿Estás seguro de eliminar el tipo "${deleteItem?.nombre}"?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}