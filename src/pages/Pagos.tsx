import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select } from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import { mockPagos, mockInmuebles } from '../lib/mockData';
import type { Pago } from '../types';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  inmueble_id: z.coerce.number().min(1, 'Selecciona un inmueble'),
  anio: z.coerce.number().min(2000).max(2100),
  trimestre: z.coerce.number().min(1).max(4).optional(),
  monto: z.coerce.number().min(0.01, 'Monto requerido'),
  estado: z.enum(['pendiente', 'pagado', 'moroso', 'exonerado']),
  fecha_pago: z.string().optional(),
  metodo_pago: z.string().optional(),
  num_recibo: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const estadoColors: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  pagado: 'bg-emerald-100 text-emerald-700',
  moroso: 'bg-red-100 text-red-700',
  exonerado: 'bg-slate-100 text-slate-600',
};

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  moroso: 'Moroso',
  exonerado: 'Exonerado',
};

export default function Pagos() {
  const { user } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  const [data, setData] = useState<Pago[]>(mockPagos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Pago | null>(null);
  const [deleteItem, setDeleteItem] = useState<Pago | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { estado: 'pendiente', anio: new Date().getFullYear() },
  });

  const openAdd = () => {
    setEditItem(null);
    reset({ estado: 'pendiente', anio: new Date().getFullYear() });
    setModalOpen(true);
  };

  const openEdit = (item: Pago) => {
    setEditItem(item);
    reset({
      inmueble_id: item.inmueble_id,
      anio: item.anio,
      trimestre: item.trimestre,
      monto: item.monto,
      estado: item.estado,
      fecha_pago: item.fecha_pago ? item.fecha_pago.split('T')[0] : '',
      metodo_pago: item.metodo_pago ?? '',
      num_recibo: item.num_recibo ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = (formData: FormData) => {
    const inmueble = mockInmuebles.find((i) => i.id === formData.inmueble_id);
    if (editItem) {
      setData((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...formData, inmueble } : d));
      toast.success('Pago actualizado');
    } else {
      const newItem: Pago = { id: Date.now(), inmueble_id: formData.inmueble_id, anio: formData.anio, trimestre: formData.trimestre, monto: formData.monto, estado: formData.estado, fecha_pago: formData.fecha_pago, metodo_pago: formData.metodo_pago, num_recibo: formData.num_recibo, creado_en: new Date().toISOString(), inmueble };
      setData((prev) => [...prev, newItem]);
      toast.success('Pago registrado');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData((prev) => prev.filter((d) => d.id !== deleteItem.id));
    toast.success('Pago eliminado');
    setDeleteItem(null);
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: Pago) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'inmueble', label: 'Inmueble', render: (row: Pago) => <span className="font-mono font-semibold text-[#0f2744] text-xs">{row.inmueble?.codigo_catastral ?? '—'}</span> },
    { key: 'anio', label: 'Año', render: (row: Pago) => <span className="font-medium">{row.anio}</span> },
    { key: 'trimestre', label: 'Trimestre', render: (row: Pago) => <span className="text-slate-600">{row.trimestre ? `T${row.trimestre}` : '—'}</span> },
    { key: 'monto', label: 'Monto', render: (row: Pago) => <span className="font-semibold text-slate-800">Q{Number(row.monto).toLocaleString()}</span> },
    { key: 'estado', label: 'Estado', render: (row: Pago) => <StatusBadge value={row.estado} colorMap={estadoColors} labelMap={estadoLabels} /> },
    { key: 'num_recibo', label: 'Recibo', render: (row: Pago) => <span className="font-mono text-xs text-slate-500">{row.num_recibo ?? '—'}</span> },
    { key: 'fecha_pago', label: 'Fecha Pago', render: (row: Pago) => <span className="text-slate-400 text-xs">{row.fecha_pago ? new Date(row.fecha_pago).toLocaleDateString('es-GT') : '—'}</span> },
  ];

  const inmuebleOptions = mockInmuebles.map((i) => ({ value: i.id, label: i.codigo_catastral }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Pagos IUSI"
        data={data}
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['num_recibo']}
        addLabel="Registrar Pago"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Pago' : 'Registrar Pago'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <FormField label="Inmueble" required error={errors.inmueble_id?.message}>
              <Select {...register('inmueble_id')} error={!!errors.inmueble_id} options={inmuebleOptions} placeholder="Seleccionar inmueble" />
            </FormField>
          </div>
          <FormField label="Año" required error={errors.anio?.message}>
            <Input type="number" {...register('anio')} error={!!errors.anio} placeholder="2024" min={2000} max={2100} />
          </FormField>
          <FormField label="Trimestre" error={errors.trimestre?.message}>
            <Select {...register('trimestre')} options={[
              { value: '', label: 'Sin trimestre' },
              { value: 1, label: 'Trimestre 1' },
              { value: 2, label: 'Trimestre 2' },
              { value: 3, label: 'Trimestre 3' },
              { value: 4, label: 'Trimestre 4' },
            ]} />
          </FormField>
          <FormField label="Monto (Q)" required error={errors.monto?.message}>
            <Input type="number" step="0.01" {...register('monto')} error={!!errors.monto} placeholder="850.00" />
          </FormField>
          <FormField label="Estado" required error={errors.estado?.message}>
            <Select {...register('estado')} error={!!errors.estado} options={[
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'pagado', label: 'Pagado' },
              { value: 'moroso', label: 'Moroso' },
              { value: 'exonerado', label: 'Exonerado' },
            ]} />
          </FormField>
          <FormField label="Fecha de Pago">
            <Input type="date" {...register('fecha_pago')} />
          </FormField>
          <FormField label="Método de Pago">
            <Input {...register('metodo_pago')} placeholder="Efectivo, Transferencia..." />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Número de Recibo">
              <Input {...register('num_recibo')} placeholder="REC-2024-001" />
            </FormField>
          </div>
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all duration-200">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#0f2744] text-white text-sm font-medium rounded-lg hover:bg-[#1a3a5c] transition-all duration-200 hover:scale-105">
              {editItem ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Pago"
        message={`¿Estás seguro de eliminar el pago "${deleteItem?.num_recibo ?? `#${deleteItem?.id}`}"?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}