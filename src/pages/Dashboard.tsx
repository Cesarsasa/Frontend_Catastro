import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, CreditCard, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


export default function Dashboard() {
  const { user, apiFetch } = useAuthStore();
      // ── Paginación y búsqueda ──
      const queryClient = useQueryClient();
      const [page, setPage]                     = useState(1);
    //  const [pages, setPages]                   = useState(1);
     // const [total, setTotal]                   = useState(0);
      const [search, setSearch]                 = useState('');
      const [debouncedSearch, setDebouncedSearch] = useState('');
      
const { data: propietariosCount } = useQuery({
  queryKey: ['propietariosCount'],
  queryFn: async () => {
    const res = await apiFetch(`propietarios/count`);
    return res.total; // 👈 devuelve solo el número
  },
  staleTime: 1000 * 60,
});

const { data: inmueblesCount } = useQuery({
  queryKey: ['inmueblesCount'],
  queryFn: async () => {
    const res = await apiFetch(`inmuebles/count`);
    return res.total; // 👈 devuelve solo el número
  },
  staleTime: 1000 * 60,
});
const { data: pagosCount} = useQuery({
  queryKey: ['pagosCount'],
  queryFn: async () => {
    const res = await apiFetch(`pagos/count`);
    return res.total; // 👈 devuelve solo el número
  },
  staleTime: 1000 * 60,
});
const { data: documentosCount} = useQuery({
  queryKey: ['documentosCount'],
  queryFn: async () => {
    const res = await apiFetch(`documentos/count`);
    return res.total; // 👈 devuelve solo el número
  },
  staleTime: 1000 * 60,
});

const { data: pagosCompletados = [] } = useQuery({
  queryKey: ['pagosRecientes'],
  queryFn: async () => {
    return await apiFetch('pagos/dashboard/pagos-recientes');
  }
});
const { data: estadoData = [] } = useQuery({
  queryKey: ['estadoInmuebles'],
  queryFn: async () => {
    return await apiFetch('inmuebles/estado');
  }
});
/*const { data: pagosPorMes = [] } = useQuery({
  queryKey: ['recaudacionMensual'],
  queryFn: async () => {
    return await apiFetch('pagos/dashboard/recaudacion-mensual');
  }
});*/

const estadoInmuebles = estadoData.map(item => ({
  name: item.estado,
  value: item._count.estado,
  color:
    item.estado === 'activo'
      ? '#10b981'
      : item.estado === 'inactivo'
      ? '#6b7280'
      : '#f59e0b'
}));
  const stats = [
    { label: 'Total Inmuebles', value: inmueblesCount || 0, icon: <Building2 size={20} />, color: 'bg-blue-50 text-blue-600', /*change: '+3 este mes' */},
    { label: 'Propietarios', value: propietariosCount || 0, icon: <Users size={20} />, color: 'bg-emerald-50 text-emerald-600', /*change: '+1 este mes' */},
    { label: 'Pagos Registrados', value: pagosCount || 0, icon: <CreditCard size={20} />, color: 'bg-amber-50 text-amber-600', /*change: 'Q97,700 total' */},
    { label: 'Documentos', value: documentosCount || 0, icon: <FileText size={20} />, color: 'bg-purple-50 text-purple-600', /*change: '3 pendientes' */},
  ];


  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="font-heading text-2xl font-bold text-slate-800">
          Bienvenido, {user?.nombre.split(' ')[0]}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Resumen del sistema catastral municipal — {new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800 font-heading">{stat.value}</p>
            <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6"
        >
          
           <div className="flex items-center gap-2 mb-5">
            <CheckCircle size={18} className="text-emerald-500" />
            <h3 className="font-heading font-semibold text-slate-800">Pagos Recientes</h3>
          </div>
          <div className="space-y-3">
            {pagosCompletados.map((pago) => (
              <div key={pago.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Clock size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{pago.inmueble?.codigo_catastral}</p>
                    <p className="text-xs text-slate-500">{pago.num_recibo}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-700">Q{Number(pago.monto).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h3 className="font-heading font-semibold text-slate-800 mb-1">Estado Inmuebles</h3>
          <p className="text-slate-400 text-xs mb-4">Distribución por estado</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={estadoInmuebles.filter(e => e.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
                {estadoInmuebles.filter(e => e.value > 0).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {estadoInmuebles.filter(e => e.value > 0).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      
    </div>
  );
}