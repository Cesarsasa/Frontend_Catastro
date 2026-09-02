import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select } from '../components/FormField';
import type { Pago } from '../types';
import { useAuthStore } from '../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  inmueble_id: z.coerce.number().min(1, 'Selecciona un inmueble'),
  anio: z.coerce.number().min(2000, 'Año inválido').max(2100, 'Año inválido'),
  trimestre: z.coerce.number().min(1).max(4).optional().or(z.literal('')),
  monto: z.coerce.number().min(0.01, 'Monto debe ser mayor a 0'),
  metodo_pago: z.string().min(1, 'Requerido'),
  num_recibo: z.string().min(1, 'Requerido').max(50),
  nit: z.string().max(20).optional(),
  estado: z.string().min(1, 'Requerido'),
});
type FormData = z.infer<typeof schema>;

const estadoOptions = [
  { value: 'pagado', label: 'Pagado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'anulado', label: 'Anulado' },
];

const metodoPagoOptions = [
  { value: 'polar', label: 'Polar (en línea)' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
];

const trimestreOptions = [
  { value: '', label: 'Sin trimestre' },
  { value: 1, label: 'T1' },
  { value: 2, label: 'T2' },
  { value: 3, label: 'T3' },
  { value: 4, label: 'T4' },
];

export default function Pagos() {
  const { user, apiFetch } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Pago | null>(null);
  const [deleteItem, setDeleteItem] = useState<Pago | null>(null);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Debounce búsqueda ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // ── Pagos API ──
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pagos', page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(debouncedSearch && { nit: debouncedSearch }),
      });
      return apiFetch(`pagos?${params}`);
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60,
  });

  // ── Inmuebles (para el select) ──
  const { data: inmuebles = [] } = useQuery({
    queryKey: ['inmuebles-select'],
    queryFn: async () => {
      const res = await apiFetch('inmuebles?limit=1000');
      return res.data ?? [];
    },
  });

  const inmuebleOptions = [
    { value: '', label: 'Seleccionar inmueble' },
    ...inmuebles.map((inm: any) => ({
      value: inm.id,
      label: `${inm.codigo_catastral} — ${inm.direccion_completa}`,
    })),
  ];

  const openAdd = () => {
    setEditItem(null);
    reset({
      inmueble_id: 0,
      anio: new Date().getFullYear(),
      trimestre: '',
      monto: 0,
      metodo_pago: 'efectivo',
      num_recibo: '',
      nit: '',
      estado: 'pagado',
    });
    setModalOpen(true);
  };

  const openEdit = (item: Pago) => {
    setEditItem(item);
    reset({
      inmueble_id: item.inmueble_id,
      anio: item.anio,
      trimestre: item.trimestre ?? '',
      monto: item.monto,
      metodo_pago: item.metodo_pago,
      num_recibo: item.num_recibo,
      nit: item.nit ?? '',
      estado: item.estado,
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
      );

      if (editItem) {
        await apiFetch(`pagos/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Pago actualizado');
      } else {
        await apiFetch('pagos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Pago creado');
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      if (err.message?.includes('recibo ya está registrado')) {
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Error al guardar el pago');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiFetch(`pagos/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Pago eliminado');
      setDeleteItem(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: Pago) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'num_recibo', label: 'No. Recibo', render: (row: Pago) => <span className="font-mono font-medium text-[#0f2744]">{row.num_recibo}</span> },
    { key: 'inmueble', label: 'Inmueble', render: (row: Pago) => <span className="text-slate-600">{row.inmueble?.codigo_catastral ?? '—'}</span> },
    { key: 'nit', label: 'NIT', render: (row: Pago) => <span className="text-slate-600">{row.nit ?? 'CF'}</span> },
    { key: 'monto', label: 'Monto', render: (row: Pago) => <span className="font-medium">Q{Number(row.monto).toFixed(2)}</span> },
    {
      key: 'estado', label: 'Estado', render: (row: Pago) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          row.estado === 'pagado' ? 'bg-green-100 text-green-700' :
          row.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {row.estado}
        </span>
      )
    },
    { key: 'fecha_pago', label: 'Fecha Pago', render: (row: Pago) => <span className="text-slate-400 text-xs">{row.fecha_pago ? new Date(row.fecha_pago).toLocaleDateString('es-GT') : '—'}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      <DataTable
        title="Pagos"
        data={data?.data ?? []}
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['num_recibo', 'nit']}
        addLabel="Nuevo Pago"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Pago' : 'Nuevo Pago'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Inmueble" required error={errors.inmueble_id?.message}>
            <Select {...register('inmueble_id')} error={!!errors.inmueble_id} options={inmuebleOptions} placeholder="Seleccionar inmueble" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Año" required error={errors.anio?.message}>
              <Input type="number" {...register('anio')} error={!!errors.anio} placeholder="2026" />
            </FormField>
            <FormField label="Trimestre" error={errors.trimestre?.message}>
              <Select {...register('trimestre')} error={!!errors.trimestre} options={trimestreOptions} />
            </FormField>
          </div>
          <FormField label="Monto (Q)" required error={errors.monto?.message}>
            <Input type="number" step="0.01" {...register('monto')} error={!!errors.monto} placeholder="50.00" />
          </FormField>
          <FormField label="Número de Recibo" required error={errors.num_recibo?.message}>
            <Input {...register('num_recibo')} error={!!errors.num_recibo} placeholder="REC-0001" maxLength={50} />
          </FormField>
          <FormField label="NIT" error={errors.nit?.message}>
            <Input {...register('nit')} error={!!errors.nit} placeholder="1234567-8 (vacío = CF)" maxLength={20} />
          </FormField>
          <FormField label="Método de Pago" required error={errors.metodo_pago?.message}>
            <Select {...register('metodo_pago')} error={!!errors.metodo_pago} options={metodoPagoOptions} />
          </FormField>
          <FormField label="Estado" required error={errors.estado?.message}>
            <Select {...register('estado')} error={!!errors.estado} options={estadoOptions} />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all duration-200">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-[#0f2744] text-white text-sm font-medium rounded-lg hover:bg-[#1a3a5c] transition-all duration-200 hover:scale-105 disabled:opacity-50">
              {editItem ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Pago"
        message={`¿Estás seguro de eliminar el pago con recibo "${deleteItem?.num_recibo}"?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}