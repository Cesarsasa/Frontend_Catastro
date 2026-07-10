import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#0f2744] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 size={28} className="text-white" />
        </div>
        <h1 className="font-heading text-6xl font-bold text-[#0f2744] mb-2">404</h1>
        <h2 className="font-heading text-xl font-semibold text-slate-700 mb-3">Página no encontrada</h2>
        <p className="text-slate-500 text-sm mb-8">La página que buscas no existe o fue movida.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f2744] text-white text-sm font-medium rounded-xl hover:bg-[#1a3a5c] transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}