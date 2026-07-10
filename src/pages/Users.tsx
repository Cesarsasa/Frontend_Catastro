import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Shield, User, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { mockUsers } from '../data/mockData';
import type { User as UserType } from '../types';

const schema = z.object({
  name: z.string().min(3, 'Requerido'),
  email: z.string().email('Correo inválido'),
  role: z.enum(['admin', 'operator', 'viewer']),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

const roleConfig = {
  admin: { label: 'Administrador', icon: ShieldCheck, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  operator: { label: 'Operador', icon: Shield, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  viewer: { label: 'Visualizador', icon: User, color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function Users() {
  const [users, setUsers] = useState<UserType[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<UserType | null>(null);
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const filtered = useMemo(() =>
    users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = !filterRole || u.role === filterRole;
      return matchSearch && matchRole;
    }), [users, search, filterRole]);

  const openCreate = () => {
    setEditing(false);
    setSelected(null);
    reset({ name: '', email: '', role: 'viewer', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (u: UserType) => {
    setEditing(true);
    setSelected(u);
    reset({ name: u.name, email: u.email, role: u.role, status: u.status });
    setModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editing && selected) {
      setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, ...data } : u));
      toast.success('Usuario actualizado correctamente');
    } else {
      const newUser: UserType = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] };
      setUsers(prev => [newUser, ...prev]);
      toast.success('Usuario creado correctamente');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!selected) return;
    setUsers(prev => prev.filter(u => u.id !== selected.id));
    toast.success('Usuario eliminado');
    setSelected(null);
  };

  const inputClass = "w-full px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30 focus:border-[#1e6b9e] transition-all duration-200";
  const labelClass = "block text-xs font-medium text-[#3a5f7a] mb-1";

  return (
    <div>
      <PageHeader
        title="Usuarios del Sistema"
        subtitle={`${users.length} usuarios registrados`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105">
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o correo..." />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2.5 border border-[#d0e8f5] rounded-lg text-sm text-[#0d2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6b9e]/30">
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="operator">Operador</option>
          <option value="viewer">Visualizador</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-[#d0e8f5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f4f9fd] border-b border-[#d0e8f5]">
                {['Usuario', 'Correo Electrónico', 'Rol', 'Estado', 'Fecha de Registro', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#4a7fa5] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7ff]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[#8ab4cc] text-sm">No se encontraron usuarios</td></tr>
              ) : filtered.map((u, i) => {
                const role = roleConfig[u.role];
                const RoleIcon = role.icon;
                return (
                  <motion.tr key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="hover:bg-[#f8fbff] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1e6b9e] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">{u.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-[#0d2137]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a5f7a]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${role.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-sm text-[#4a7fa5]">{u.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a7fa5] hover:bg-[#e8f4fd] hover:text-[#1e6b9e] transition-all" aria-label="Editar"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(u); setDeleteDialog(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a7fa5] hover:bg-red-50 hover:text-red-500 transition-all" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#f0f7ff] bg-[#f8fbff]">
          <p className="text-xs text-[#8ab4cc]">Mostrando {filtered.length} de {users.length} usuarios</p>
        </div>
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre Completo</label>
            <input {...register('name')} className={inputClass} placeholder="Nombre del usuario" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Correo Electrónico</label>
            <input type="email" {...register('email')} className={inputClass} placeholder="usuario@municipio.gob" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rol</label>
              <select {...register('role')} className={inputClass}>
                <option value="viewer">Visualizador</option>
                <option value="operator">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select {...register('status')} className={inputClass}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#d0e8f5] rounded-lg text-sm font-medium text-[#3a5f7a] hover:bg-[#f0f7ff] transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#1e6b9e] hover:bg-[#1a5c8a] text-white text-sm font-semibold rounded-lg transition-all">{editing ? 'Guardar Cambios' : 'Crear Usuario'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} title="Eliminar Usuario" message={`¿Está seguro de eliminar al usuario ${selected?.name}? Esta acción no se puede deshacer.`} />
    </div>
  );
}