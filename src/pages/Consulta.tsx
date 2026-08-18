import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CreditCard, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  dpi: z.string().min(1, 'Ingrese su DPI').regex(/^\d+$/, 'El DPI solo debe contener números'),
});

type FormData = z.infer<typeof schema>;

export default function ConsultaCertificados() {
  const navigate = useNavigate();
  const { apiFetch } = useAuthStore();
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const propietario = await apiFetch(`propietarios/dpi-user/${encodeURIComponent(data.dpi.trim())}`);
      navigate(`/certificados/propietario/${propietario.dpi}`);
      //navigate('/dashboard');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'DPI no encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between bg-[#2b6cb0] p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e8a020] rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#e8a020] rounded-full translate-y-24 -translate-x-24" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-[#e8a020] rounded-xl flex items-center justify-center">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <p className="font-heading text-white font-bold text-lg leading-tight">Catastro Municipal</p>
                <p className="text-white/50 text-xs">Sistema de Gestión</p>
              </div>
            </div>
            <h2 className="font-heading text-white text-3xl font-bold leading-tight mb-4">
              Consulta de<br />Certificados
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Ingresa tu DPI para consultar los certificados disponibles de tus inmuebles.
            </p>
          </div>
          <div className="relative space-y-3">
            {[
              'Consulta pública, sin necesidad de cuenta',
              'Certificados por inmueble',
              'Estado y vigencia al instante',
              'Descarga directa',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-[#e8a020]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-[#e8a020] rounded-full" />
                </div>
                <span className="text-white/70 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-9 h-9 bg-[#2b6cb0] rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <p className="font-heading text-[#2b6cb0] font-bold text-lg">Catastro Municipal</p>
            </div>

            <h1 className="font-heading text-slate-800 text-2xl font-bold mb-1">Consultar Certificados</h1>
            <p className="text-slate-500 text-sm mb-8">Ingresa tu DPI</p>

            {authError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="dpi" className="block text-sm font-medium text-slate-700 mb-1.5">
                  DPI
                </label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="dpi"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Ingrese su DPI"
                    {...register('dpi')}
                    className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.dpi ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-[#2b6cb0]/20 focus:border-[#2b6cb0]/40'}`}
                  />
                </div>
                {errors.dpi && <p className="text-red-500 text-xs mt-1">{errors.dpi.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#2b6cb0] text-white text-sm font-semibold rounded-xl hover:bg-[#3182ce] transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Consultar'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}