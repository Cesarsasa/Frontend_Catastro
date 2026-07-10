import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, Building2, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { mockProperties, mockOwners } from '../data/mockData';
import type { Property } from '../types';

const schema = z.object({
  cadastralCode: z.string().min(1, 'Requerido'),
  address: z.string().min(3, 'Requerido'),
  district: z.string().min(1, 'Requerido'),
  area: z.coerce.number().positive('Debe ser positivo'),
  builtArea: z.coerce.number().min(0),
  propertyType: z.enum(['residential', 'commercial', 'industrial', 'land']),
  status: z.enum(['registered', 'pending', 'disputed']),
  ownerId: z.string().min(1, 'Requerido'),
  selfAssessment: z.coerce.number().positive('Debe ser positivo'),
});

type FormData = z.infer<typeof schema>;

const typeLabels: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  land: 'Terreno',
};

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Property | null>(null);
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const filtered = useMemo(() =>
    properties.filter(p => {
      const matchSearch = p.cadastralCode.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || p.propertyType === filterType;
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    }), [properties, search, filterType, filterStatus]);

  const openCreate = () => {
    setEditing(false);
    setSelected(null);
    reset({ cadastralCode: '', address: '', district: '', area: 0, builtArea: 0, propertyType: 'residential', status: 'pending', ownerId: '', selfAssessment: 0 });
    setModalOpen(true);
  };

  const openEdit = (p: Property) => {
    setEditing(true);
    setSelected(p);
    reset({ cadastralCode: p.cadastralCode, address: p.address, district: p.district, area: p.area, builtArea: p.builtArea, propertyType: p.propertyType, status: p.status, ownerId: p.ownerId, selfAssessment: p.selfAssessment });
    setModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    const owner = mockOwners.find(o => o.id === data.ownerId);
    if (editing && selected) {
      setProperties(prev => prev.map(p => p.id === selected.id ? { ...p, ...data, ownerName: owner?.fullName ?? '' } : p));
      toast.success('Inmueble actualizado correctamente');
    } else {
      const newProp: Property = { ...data, id: Date.now().toString(), ownerName: owner?.fullName ?? '', createdAt: new Date().toISOString().split('T')[0] };
      setProperties(prev => [newProp, ...prev]);
      toast.success('Inmueble registrado correctamente');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!selected) return;
    setProperties(prev => prev.filter(p => p.id !== selected.id));
    toast.success('Inmueble eliminado');
    setSelected(null);
  };

  const inputClass = "w-full px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30 focus:border-[#1e6b9e] transition-all duration-200";
  const labelClass = "block text-xs font-medium text-[#3a5f7a] mb-1";

  return (
    <div>
      <PageHeader
        title="Inmuebles"
        subtitle={`${properties.length} inmuebles registrados en el sistema`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105">
            <Plus className="w-4 h-4" /> Nuevo Inmueble
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por código, dirección o propietario..." />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7fa5]" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="pl-9 pr-8 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30 appearance-none">
              <option value="">Todos los tipos</option>
              <option value="residential">Residencial</option>
              <option value="commercial">Comercial</option>
              <option value="industrial">Industrial</option>
              <option value="land">Terreno</option>
            </select>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30">
            <option value="">Todos los estados</option>
            <option value="registered">Registrado</option>
            <option value="pending">Pendiente</option>
            <option value="disputed">En Disputa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-[#d0e8f5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f4f9fd] border-b border-[#d0e8f5]">
                {['Código Catastral', 'Dirección', 'Tipo', 'Área (m²)', 'Propietario', 'Autovalúo', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#4a7fa5] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7ff]">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#8ab4cc] text-sm">No se encontraron inmuebles</td></tr>
              ) : filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="hover:bg-[#f8fbff] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#e8f4fd] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#1e6b9e]" />
                      </div>
                      <span className="text-sm font-mono font-medium text-[#0d2137]">{p.cadastralCode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#3a5f7a] max-w-[200px] truncate">{p.address}</td>
                  <td className="px-4 py-3 text-sm text-[#3a5f7a]">{typeLabels[p.propertyType]}</td>
                  <td className="px-4 py-3 text-sm text-[#3a5f7a]">{p.area.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#3a5f7a] max-w-[160px] truncate">{p.ownerName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#0d2137]">S/ {p.selfAssessment.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(p); setViewModal(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a7fa5] hover:bg-[#e8f4fd] hover:text-[#1e6b9e] transition-all" aria-label="Ver"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a7fa5] hover:bg-[#e8f4fd] hover:text-[#1e6b9e] transition-all" aria-label="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { setSelected(p); setDeleteDialog(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a7fa5] hover:bg-red-50 hover:text-red-500 transition-all" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#f0f7ff] bg-[#f8fbff]">
          <p className="text-xs text-[#8ab4cc]">Mostrando {filtered.length} de {properties.length} inmuebles</p>
        </div>
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Inmueble' : 'Nuevo Inmueble'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Código Catastral</label>
              <input {...register('cadastralCode')} className={inputClass} placeholder="CAT-2024-XXX" />
              {errors.cadastralCode && <p className="text-xs text-red-500 mt-1">{errors.cadastralCode.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Distrito</label>
              <input {...register('district')} className={inputClass} placeholder="Ej: Miraflores" />
              {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input {...register('address')} className={inputClass} placeholder="Av. Principal 123, Distrito" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Área Total (m²)</label>
              <input type="number" {...register('area')} className={inputClass} />
              {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Área Construida (m²)</label>
              <input type="number" {...register('builtArea')} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de Inmueble</label>
              <select {...register('propertyType')} className={inputClass}>
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
                <option value="industrial">Industrial</option>
                <option value="land">Terreno</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select {...register('status')} className={inputClass}>
                <option value="pending">Pendiente</option>
                <option value="registered">Registrado</option>
                <option value="disputed">En Disputa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Propietario</label>
              <select {...register('ownerId')} className={inputClass}>
                <option value="">Seleccionar propietario</option>
                {mockOwners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
              </select>
              {errors.ownerId && <p className="text-xs text-red-500 mt-1">{errors.ownerId.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Autovalúo (S/)</label>
              <input type="number" {...register('selfAssessment')} className={inputClass} />
              {errors.selfAssessment && <p className="text-xs text-red-500 mt-1">{errors.selfAssessment.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#d0e8f5] rounded-lg text-sm font-medium text-[#3a5f7a] hover:bg-[#f0f7ff] transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all">{editing ? 'Guardar Cambios' : 'Registrar Inmueble'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {selected && (
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Detalle del Inmueble" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#f4f9fd] rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-[#1e6b9e] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-mono font-bold text-[#0d2137]">{selected.cadastralCode}</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            {[
              ['Dirección', selected.address],
              ['Distrito', selected.district],
              ['Tipo', typeLabels[selected.propertyType]],
              ['Área Total', `${selected.area.toLocaleString()} m²`],
              ['Área Construida', `${selected.builtArea.toLocaleString()} m²`],
              ['Propietario', selected.ownerName],
              ['Autovalúo', `S/ ${selected.selfAssessment.toLocaleString()}`],
              ['Fecha de Registro', selected.createdAt],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-[#f0f7ff] last:border-0">
                <span className="text-xs font-medium text-[#4a7fa5]">{label}</span>
                <span className="text-sm text-[#0d2137] font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} title="Eliminar Inmueble" message={`¿Está seguro de eliminar el inmueble ${selected?.cadastralCode}? Esta acción no se puede deshacer.`} />
    </div>
  );
}