import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Trash2, Eye, FileText, FileCheck, FileWarning, File } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { mockDocuments, mockProperties, mockOwners } from '../data/mockData';
import type { Document } from '../types';

const schema = z.object({
  title: z.string().min(3, 'Requerido'),
  type: z.enum(['deed', 'certificate', 'permit', 'report', 'other']),
  propertyId: z.string().min(1, 'Requerido'),
  ownerId: z.string().min(1, 'Requerido'),
  status: z.enum(['active', 'archived', 'pending']),
});

type FormData = z.infer<typeof schema>;

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  deed: { label: 'Escritura', icon: FileCheck, color: 'text-blue-600 bg-blue-50' },
  certificate: { label: 'Certificado', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
  permit: { label: 'Permiso', icon: FileWarning, color: 'text-amber-600 bg-amber-50' },
  report: { label: 'Informe', icon: FileText, color: 'text-purple-600 bg-purple-50' },
  other: { label: 'Otro', icon: File, color: 'text-gray-600 bg-gray-50' },
};

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Document | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedPropertyId = watch('propertyId');
  const selectedProperty = mockProperties.find(p => p.id === selectedPropertyId);

  const filtered = useMemo(() =>
    documents.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.propertyCode.toLowerCase().includes(search.toLowerCase()) ||
        d.ownerName.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || d.type === filterType;
      const matchStatus = !filterStatus || d.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    }), [documents, search, filterType, filterStatus]);

  const openCreate = () => {
    reset({ title: '', type: 'deed', propertyId: '', ownerId: '', status: 'pending' });
    setModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    const property = mockProperties.find(p => p.id === data.propertyId);
    const owner = mockOwners.find(o => o.id === data.ownerId);
    const newDoc: Document = {
      ...data,
      id: Date.now().toString(),
      propertyCode: property?.cadastralCode ?? '',
      ownerName: owner?.fullName ?? '',
      fileSize: '—',
      uploadedBy: 'Usuario Actual',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDocuments(prev => [newDoc, ...prev]);
    toast.success('Documento registrado correctamente');
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!selected) return;
    setDocuments(prev => prev.filter(d => d.id !== selected.id));
    toast.success('Documento eliminado');
    setSelected(null);
  };

  const inputClass = "w-full px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30 focus:border-[#1e6b9e] transition-all duration-200";
  const labelClass = "block text-xs font-medium text-[#3a5f7a] mb-1";

  return (
    <div>
      <PageHeader
        title="Documentos"
        subtitle={`${documents.length} documentos en el sistema`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105">
            <Plus className="w-4 h-4" /> Nuevo Documento
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título, código catastral o propietario..." />
        </div>
        <div className="flex gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30">
            <option value="">Todos los tipos</option>
            <option value="deed">Escritura</option>
            <option value="certificate">Certificado</option>
            <option value="permit">Permiso</option>
            <option value="report">Informe</option>
            <option value="other">Otro</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30">
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#8ab4cc] text-sm">No se encontraron documentos</div>
        ) : filtered.map((d, i) => {
          const type = typeConfig[d.type];
          const TypeIcon = type.icon;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-[#d0e8f5] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${type.color}`}>
                  <TypeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0d2137] text-sm leading-tight truncate">{d.title}</p>
                  <p className="text-xs text-[#4a7fa5] mt-0.5">{type.label}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8ab4cc]">Código</span>
                  <span className="font-mono text-[#0d2137] font-medium">{d.propertyCode}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8ab4cc]">Propietario</span>
                  <span className="text-[#3a5f7a] truncate max-w-[140px] text-right">{d.ownerName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8ab4cc]">Tamaño</span>
                  <span className="text-[#3a5f7a]">{d.fileSize}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8ab4cc]">Subido por</span>
                  <span className="text-[#3a5f7a]">{d.uploadedBy}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-[#f0f7ff]">
                <button onClick={() => { setSelected(d); setViewModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#4a7fa5] hover:bg-[#e8f4fd] hover:text-[#1e6b9e] transition-all">
                  <Eye className="w-3.5 h-3.5" /> Ver
                </button>
                <button onClick={() => toast.info('Conecte el backend para descargar archivos')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#4a7fa5] hover:bg-[#e8f4fd] hover:text-[#1e6b9e] transition-all">
                  <Download className="w-3.5 h-3.5" /> Descargar
                </button>
                <button onClick={() => { setSelected(d); setDeleteDialog(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#4a7fa5] hover:bg-red-50 hover:text-red-500 transition-all">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Documento" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Título del Documento</label>
            <input {...register('title')} className={inputClass} placeholder="Ej: Escritura Pública — Av. Principal 123" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de Documento</label>
              <select {...register('type')} className={inputClass}>
                <option value="deed">Escritura</option>
                <option value="certificate">Certificado</option>
                <option value="permit">Permiso</option>
                <option value="report">Informe</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select {...register('status')} className={inputClass}>
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Inmueble Asociado</label>
            <select {...register('propertyId')} className={inputClass}>
              <option value="">Seleccionar inmueble</option>
              {mockProperties.map(p => <option key={p.id} value={p.id}>{p.cadastralCode} — {p.address}</option>)}
            </select>
            {errors.propertyId && <p className="text-xs text-red-500 mt-1">{errors.propertyId.message}</p>}
          </div>
          {selectedProperty && (
            <div className="p-3 bg-[#f4f9fd] rounded-lg text-xs text-[#4a7fa5]">
              Propietario del inmueble: <span className="font-medium text-[#0d2137]">{selectedProperty.ownerName}</span>
            </div>
          )}
          <div>
            <label className={labelClass}>Propietario</label>
            <select {...register('ownerId')} className={inputClass}>
              <option value="">Seleccionar propietario</option>
              {mockOwners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
            </select>
            {errors.ownerId && <p className="text-xs text-red-500 mt-1">{errors.ownerId.message}</p>}
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">La carga de archivos estará disponible al conectar el backend Node.js/Express.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#d0e8f5] rounded-lg text-sm font-medium text-[#3a5f7a] hover:bg-[#f0f7ff] transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all">Registrar Documento</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {selected && (
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Detalle del Documento" size="sm">
          <div className="space-y-3">
            {(() => {
              const type = typeConfig[selected.type];
              const TypeIcon = type.icon;
              return (
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${type.color}`}>
                  <TypeIcon className="w-8 h-8" />
                  <div>
                    <p className="font-bold text-[#0d2137] text-sm">{selected.title}</p>
                    <p className="text-xs opacity-70">{type.label}</p>
                  </div>
                </div>
              );
            })()}
            {[
              ['Código Catastral', selected.propertyCode],
              ['Propietario', selected.ownerName],
              ['Tamaño', selected.fileSize],
              ['Subido por', selected.uploadedBy],
              ['Fecha', selected.createdAt],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-[#f0f7ff] last:border-0">
                <span className="text-xs font-medium text-[#4a7fa5]">{label}</span>
                <span className="text-sm text-[#0d2137] font-medium">{value}</span>
              </div>
            ))}
            <div className="flex justify-between py-2">
              <span className="text-xs font-medium text-[#4a7fa5]">Estado</span>
              <StatusBadge status={selected.status} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} title="Eliminar Documento" message={`¿Está seguro de eliminar "${selected?.title}"? Esta acción no se puede deshacer.`} />
    </div>
  );
}