import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginUser } from '../lib/auth';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const user = await loginUser(data.email, data.password);
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@catastro.gob.gt', password: 'admin123', rol: 'Administrador' },
   
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1e38] via-[#0f2744] to-[#1a3a5c] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between bg-[#0f2744] p-12 relative overflow-hidden">
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
              Gestión Catastral<br />Integrada
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Administra inmuebles, propietarios, pagos de IUSI y documentación catastral desde una plataforma centralizada y segura.
            </p>
          </div>
          <div className="relative space-y-3">
            {[
              'Registro y consulta de inmuebles',
              'Gestión de propietarios y documentos',
              'Control de pagos IUSI',
              'Auditoría completa de operaciones',
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
              <div className="w-9 h-9 bg-[#0f2744] rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <p className="font-heading text-[#0f2744] font-bold text-lg">Catastro Municipal</p>
            </div>

            <h1 className="font-heading text-slate-800 text-2xl font-bold mb-1">Iniciar Sesión</h1>
            <p className="text-slate-500 text-sm mb-8">Ingresa tus credenciales para acceder al sistema</p>

            {authError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="usuario@catastro.gob.gt"
                    {...register('email')}
                    className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-[#0f2744]/20 focus:border-[#0f2744]/40'}`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`w-full pl-10 pr-12 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-[#0f2744]/20 focus:border-[#0f2744]/40'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#0f2744] text-white text-sm font-semibold rounded-xl hover:bg-[#1a3a5c] transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cuentas de demostración</p>
              <div className="space-y-2">
                {demoAccounts.map((acc) => (
                  <div key={acc.email} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-600 font-medium">{acc.rol}:</span>
                      <span className="text-slate-500 ml-1">{acc.email}</span>
                    </div>
                    <span className="text-slate-400 font-mono">{acc.password}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}