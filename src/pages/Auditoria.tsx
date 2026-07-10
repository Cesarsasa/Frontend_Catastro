import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { mockAuditorias } from '../lib/mockData';
import type { Auditoria } from '../types';

const accionColors: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

export default function AuditoriaPage() {
  const [data] = useState<Auditoria[]>(mockAuditorias);

  const columns = [
    { key: 'id', label: 'ID', render: (row: Auditoria) => <span className="text-slate-400 text-xs font-mono">#{row.id}</span> },
    { key: 'tabla', label: 'Tabla', render: (row: Auditoria) => <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{row.tabla}</span> },
    { key: 'registro_id', label: 'Registro', render: (row: Auditoria) => <span className="font-mono text-xs text-slate-500">#{row.registro_id}</span> },
    { key: 'accion', label: 'Acción', render: (row: Auditoria) => <StatusBadge value={row.accion} colorMap={accionColors} /> },
    { key: 'usuario', label: 'Usuario', render: (row: Auditoria) => <span className="text-slate-700 text-sm">{row.usuario?.nombre ?? '—'}</span> },
    { key: 'ip', label: 'IP', render: (row: Auditoria) => <span className="font-mono text-xs text-slate-400">{row.ip ?? '—'}</span> },
    { key: 'creado_en', label: 'Fecha', render: (row: Auditoria) => <span className="text-slate-400 text-xs">{new Date(row.creado_en).toLocaleString('es-GT')}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Shield size={18} className="text-amber-600 flex-shrink-0" />
        <p className="text-amber-800 text-sm">
          El registro de auditoría es de <strong>solo lectura</strong>. Muestra todas las operaciones realizadas en el sistema.
        </p>
      </div>

      <DataTable
        title="Registro de Auditoría"
        data={data}
        columns={columns}
        canAdd={false}
        canEdit={false}
        canDelete={false}
        searchKeys={['tabla', 'ip']}
      />
    </motion.div>
  );
}