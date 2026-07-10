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
import StatusBadge from '../components/StatusBadge';
import { mockUsuarios } from '../lib/mockData';
import type { Usuario } from '../types';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(150),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'), // nuevo campo
  rol: z.enum(['admin', 'editor', 'consulta']),
  activo: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const rolColors: Record<string, string> = {
  admin: 'bg-amber-100 text-amber-800',
  editor: 'bg-emerald-100 text-emerald-800',
  consulta: 'bg-sky-100 text-sky-800',
};

export default function Usuarios() {
  const { user: currentUser, apiFetch} = useAuthStore();
  //const [data, setData] = useState<Usuario[]>(mockUsuarios);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Usuario | null>(null);
  const [deleteItem, setDeleteItem] = useState<Usuario | null>(null);
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
    defaultValues: { rol: 'consulta', activo: true },
  });

  // ── Usuarios API
        const { data, isLoading, error, refetch } = useQuery({
          queryKey: ['users', page, debouncedSearch],
          queryFn: async () => {
            const params = new URLSearchParams({
              page: String(page),
              limit: '20',
              ...(debouncedSearch && { buscar: debouncedSearch }),
            });
            return apiFetch(`users?${params}`);
          },
          placeholderData: (prev) => prev,
          staleTime: 1000 * 60,
        });

  const openAdd = () => {
    setEditItem(null);
    reset({ nombre: '', email: '', rol: 'consulta', activo: true });
    setModalOpen(true);
  };

  const openEdit = (item: Usuario) => {
    setEditItem(item);
    reset({ nombre: item.nombre, email: item.email, rol: item.rol, activo: item.activo });
    setModalOpen(true);
  };

   const onSubmit = async(formData: FormData) => {
     try{
       const payload = Object.fromEntries(
       Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
 
       );
       let usuarioId: number | null = null;
 
             if (editItem) {
           const res = await apiFetch(`users/${editItem.id}`, {
             method: 'PUT',
             body: JSON.stringify(payload),
           });
           usuarioId = editItem.id;
             toast.success('Usuario  actualizado');
           } else {
             const res = await apiFetch('users', {
               method: 'POST',
               body: JSON.stringify(payload),
             });
             usuarioId = res.id;
             toast.success('Usuario creado', usuarioId ? { autoClose: 2000 } : undefined);
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
      await apiFetch(`users/${deleteItem.id}`, { method: 'DELETE' });
      toast.success('Usuario eliminado');
      setDeleteItem(null);
      //fetchData(); // refresca la página actual
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };
  const columns = [
    { key: 'id', label: 'ID', render: (row: Usuario) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'nombre', label: 'Nombre', render: (row: Usuario) => <span className="font-medium text-slate-800">{row.nombre}</span> },
    { key: 'email', label: 'Email', render: (row: Usuario) => <span className="text-slate-500 text-xs">{row.email}</span> },
    { key: 'rol', label: 'Rol', render: (row: Usuario) => <StatusBadge value={row.rol} colorMap={rolColors} /> },
    { key: 'activo', label: 'Estado', render: (row: Usuario) => (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${row.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {row.activo ? 'Activo' : 'Inactivo'}
      </span>
    )},
    { key: 'creado_en', label: 'Creado', render: (row: Usuario) => <span className="text-slate-400 text-xs">{new Date(row.creado_en).toLocaleDateString('es-GT')}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <DataTable
        title="Usuarios del Sistema"
        data= {data?.data ?? []}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteItem}
        searchKeys={['nombre', 'email']}
        addLabel="Nuevo Usuario"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Nombre Completo" required error={errors.nombre?.message}>
            <Input {...register('nombre')} error={!!errors.nombre} placeholder="Juan Pérez García" />
          </FormField>
          <FormField label="Correo Electrónico" required error={errors.email?.message}>
            <Input type="email" {...register('email')} error={!!errors.email} placeholder="usuario@catastro.gob.gt" />
          </FormField>
          <FormField label="Contraseña" required error={errors.password?.message}>
          <Input type="password" {...register('password')} error={!!errors.password} placeholder="********" />
        </FormField>

          <FormField label="Rol" required error={errors.rol?.message}>
            <Select {...register('rol')} error={!!errors.rol} options={[
              { value: 'admin', label: 'Administrador' },
              { value: 'editor', label: 'Editor' },
              { value: 'consulta', label: 'Consulta' },
            ]} />
          </FormField>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="activo" {...register('activo')} className="w-4 h-4 rounded border-slate-300 text-[#0f2744] focus:ring-[#0f2744]/20" />
            <label htmlFor="activo" className="text-sm font-medium text-slate-700">Usuario activo</label>
          </div>
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
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar al usuario "${deleteItem?.nombre}"?`}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}