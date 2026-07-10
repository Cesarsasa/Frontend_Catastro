import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, UserCheck, Phone, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { mockOwners } from '../data/mockData';
import type { Owner } from '../types';

const schema = z.object({
  fullName: z.string().min(3, 'Requerido'),
  documentType: z.enum(['DNI', 'RUC', 'CE']),
  documentNumber: z.string().min(8, 'Mínimo 8 caracteres'),
  phone: z.string().min(7, 'Requerido'),
  email: z.string().email('Correo inválido'),
  address: z.string().min(5, 'Requerido'),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

export default function Owners() {
  const [owners, setOwners] = useState<Owner[]>(mockOwners);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Owner | null>(null);
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const filtered = useMemo(() =>
    owners.filter(o =>
      o.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.documentNumber.includes(search) ||
      o.email.toLowerCase().includes(search.toLowerCase())
    ), [owners, search]);

  const openCreate = () => {
    setEditing(false);
    setSelected(null);
    reset({ fullName: '', documentType: 'DNI', documentNumber: '', phone: '', email: '', address: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (o: Owner) => {
    setEditing(true);
    setSelected(o);
    reset({ fullName: o.fullName, documentType: o.documentType, documentNumber: o.documentNumber, phone: o.phone, email: o.email, address: o.address, status: o.status });
    setModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editing && selected) {
      setOwners(prev => prev.map(o => o.id === selected.id ? { ...o, ...data } : o));
      toast.success('Propietario actualizado correctamente');
    } else {
      const newOwner: Owner = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] };
      setOwners(prev => [newOwner, ...prev]);
      toast.success('Propietario registrado correctamente');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!selected) return;
    setOwners(prev => prev.filter(o => o.id !== selected.id));
    toast.success('Propietario eliminado');
    setSelected(null);
  };

  const inputClass = "w-full px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30 focus:border-[#1e6b9e] transition-all duration-200";
  const labelClass = "block text-xs font-medium text-[#3a5f7a] mb-1";

  return (
    <div>
      <PageHeader
        title="Propietarios"
        subtitle={`${owners.length} propietarios registrados`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105">
            <Plus className="w-4 h-4" /> Nuevo Propietario
          </button>
        }
      />

      <div className="mb-6 max-w-md">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, documento o correo..." />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#8ab4cc] text-sm">No se encontraron propietarios</div>
        ) : filtered.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-xl border border-[#d0e8f5] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#e8f4fd] flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-[#1e6b9e]" />
                </div>
                <div>
                  <p className="font-semibold text-[#0d2137] text-sm leading-tight">{o.fullName}</p>
                  <p className="text-xs text-[#4a7fa5] mt-0.5">{o.documentType}: {o.documentNumber}</p>
                </div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-[#4a7fa5]">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{o.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#4a7fa5]">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{o.email}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-[#f0f7ff]">
              <button onClick={() => { setSelected(o); setViewModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#4a7fa5] hover:bg-[#e8f4fd] hover:text-[#1e6b9e] transition-all">
                <Eye className="w-3.5 h-3.5" /> Ver
              </button>
              <button onClick={() => openEdit(o)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#4a7fa5] hover:bg-[#e8f4fd] hover:text-[#1e6b9e] transition-all">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => { setSelected(o); setDeleteDialog(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#4a7fa5] hover:bg-red-50 hover:text-red-500 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Propietario' : 'Nuevo Propietario'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre Completo / Razón Social</label>
            <input {...register('fullName')} className={inputClass} placeholder="Nombre completo" />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de Documento</label>
              <select {...register('documentType')} className={inputClass}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">Carnet de Extranjería</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Número de Documento</label>
              <input {...register('documentNumber')} className={inputClass} placeholder="12345678" />
              {errors.documentNumber && <p className="text-xs text-red-500 mt-1">{errors.documentNumber.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input {...register('phone')} className={inputClass} placeholder="987654321" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Correo Electrónico</label>
              <input type="email" {...register('email')} className={inputClass} placeholder="correo@email.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input {...register('address')} className={inputClass} placeholder="Av. Principal 123" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select {...register('status')} className={inputClass}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#d0e8f5] rounded-lg text-sm font-medium text-[#3a5f7a] hover:bg-[#f0f7ff] transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all">{editing ? 'Guardar Cambios' : 'Registrar Propietario'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {selected && (
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Detalle del Propietario" size="sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-[#f4f9fd] rounded-xl mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#1e6b9e] flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#0d2137]">{selected.fullName}</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            {[
              ['Tipo Doc.', selected.documentType],
              ['N° Documento', selected.documentNumber],
              ['Teléfono', selected.phone],
              ['Correo', selected.email],
              ['Dirección', selected.address],
              ['Registrado', selected.createdAt],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-[#f0f7ff] last:border-0">
                <span className="text-xs font-medium text-[#4a7fa5]">{label}</span>
                <span className="text-sm text-[#0d2137] font-medium text-right max-w-[200px] truncate">{value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} title="Eliminar Propietario" message={`¿Está seguro de eliminar a ${selected?.fullName}? Esta acción no se puede deshacer.`} />
    </div>
  );
}