import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input, Select } from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import { mockDocumentos, mockInmuebles, mockPropietarios } from '../lib/mockData';
import type { Documento } from '../types';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  inmueble_id: z.coerce.number().optional(),
  propietario_id: z.coerce.number().optional(),
  tipo: z.enum(['escritura', 'plano', 'foto', 'dpi', 'certificacion', 'recibo', 'otro']).optional(),
  nombre: z.string().min(1, 'Requerido').max(255),
  ruta_s3: z.string().min(1, 'Requerido'),
  url: z.string().url('URL inválida'),
  mime_type: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const tipoColors: Record<string, string> = {
  escritura: 'bg-blue-100 text-blue-700',
  plano: 'bg-purple-100 text-purple-700',
  foto: 'bg-pink-100 text-pink-700',
  dpi: 'bg-amber-100 text-amber-700',
  certificacion: 'bg-emerald-100 text-emerald-700',
  recibo: 'bg-orange-100 text-orange-700',
  otro: 'bg-slate-100 text-slate-600',
};

export default function Documentos() {
  const { user } = useAuthStore();
  const canWrite = user?.rol === 'admin' || user?.rol === 'editor';
  const [data, setData] = useState<Documento[]>(mockDocumentos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Documento | null>(null);
  const [deleteItem, setDeleteItem] = useState<Documento | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openAdd = () => {
    setEditItem(null);
    reset({ nombre: '', ruta_s3: '', url: '' });
    setModalOpen(true);
  };

  const openEdit = (item: Documento) => {
    setEditItem(item);
    reset({ inmueble_id: item.inmueble_id, propietario_id: item.propietario_id, tipo: item.tipo, nombre: item.nombre, ruta_s3: item.ruta_s3, url: item.url, mime_type: item.mime_type ?? '' });
    setModalOpen(true);
  };

  const onSubmit = (formData: FormData) => {
    const inmueble = mockInmuebles.find((i) => i.id === formData.inmueble_id);
    const propietario = mockPropietarios.find((p) => p.id === formData.propietario_id);
    if (editItem) {
      setData((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...formData, inmueble, propietario } : d));
      toast.success('Documento actualizado');
    } else {
      const newItem: Documento = { id: Date.now(), ...formData, inmueble, propietario, creado_en: new Date().toISOString() };
      setData((prev) => [...prev, newItem]);
      toast.success('Documento registrado');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData((prev) => prev.filter((d) => d.id !== deleteItem.id));
    toast.success('Documento eliminado');
    setDeleteItem(null);
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row: Documento) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'tipo', label: 'Tipo', render: (row: Documento) => row.tipo ? <StatusBadge value={row.tipo} colorMap={tipoColors} /> : <span className="text-slate-400">—</span> },
    { key: 'nombre', label: 'Nombre', render: (row: Documento) => <span className="font-medium text-slate-800">{row.nombre}</span> },
    { key: 'inmueble', label: 'Inmueble', render: (row: Documento) => <span className="font-mono text-xs text-slate-500">{row.inmueble?.codigo_catastral ?? '—'}</span> },
    { key: 'propietario', label: 'Propietario', render: (row: Documento) => <span className="text-slate-600 text-xs">{row.propietario?.nombre ?? '—'}</span> },
    { key: 'url', label: 'Enlace', render: (row: Documento) => (
      <a href={row.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#0f2744] hover:text-[#e8a020] transition-colors text-xs">
        <ExternalLink size={12} /> Ver
      </a>
    )},
    { key: 'creado_en', label: 'Subido', render: (row: Documento) => <span className="text-slate-400 text-xs">{new Date(row.creado_en).toLocaleDateString('es-GT')}</span> },
  ];

  const inmuebleOptions = [{ value: '', label: 'Sin inmueble' }, ...mockInmuebles.map((i) => ({ value: i.id, label: i.codigo_catastral }))];
  const propOptions = [{ value: '', label: 'Sin propietario' }, ...mockPropietarios.map((p) => ({ value: p.id, label: p.nombre }))];
  const tipoOptions = [
    { value: '', label: 'Sin tipo' },
    { value: 'escritura', label: 'Escritura' },
    { value: 'plano', label: 'Plano' },
    { value: 'foto', label: 'Foto' },
    { value: 'dpi', label: 'DPI' },
    { value: 'certificacion', label: 'Certificación' },
    { value: 'recibo', label: 'Recibo' },
    { value: 'otro', label: 'Otro' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Documentos"
        data={data}
        columns={columns}
        onAdd={canWrite ? openAdd : undefined}
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canWrite ? setDeleteItem : undefined}
        canAdd={canWrite}
        canEdit={canWrite}
        canDelete={canWrite}
        searchKeys={['nombre']}
        addLabel="Nuevo Documento"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Documento' : 'Nuevo Documento'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Inmueble">
            <Select {...register('inmueble_id')} options={inmuebleOptions} />
          </FormField>
          <FormField label="Propietario">
            <Select {...register('propietario_id')} options={propOptions} />
          </FormField>
          <FormField label="Tipo de Documento">
            <Select {...register('tipo')} options={tipoOptions} />
          </FormField>
          <FormField label="Tipo MIME">
            <Input {...register('mime_type')} placeholder="application/pdf" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Nombre del Documento" required error={errors.nombre?.message}>
              <Input {...register('nombre')} error={!!errors.nombre} placeholder="Escritura Pública No. 45" />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Ruta S3" required error={errors.ruta_s3?.message}>
              <Input {...register('ruta_s3')} error={!!errors.ruta_s3} placeholder="s3://catastro/docs/archivo.pdf" />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="URL de Acceso" required error={errors.url?.message}>
              <Input type="url" {...register('url')} error={!!errors.url} placeholder="https://example.com/docs/archivo.pdf" />
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
        title="Eliminar Documento"
        message={`¿Estás seguro de eliminar el documento "${deleteItem?.nombre}"?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}