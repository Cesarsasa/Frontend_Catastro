import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, MapPin, Map, Navigation,
  FileText, CreditCard, ClipboardList, LogOut, Menu, X,
  ChevronDown, Shield, Layers
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Inmuebles', path: '/inmuebles', icon: <Building2 size={18} /> },
  { label: 'Propietarios', path: '/propietarios', icon: <Users size={18} /> },
  { label: 'Pagos', path: '/pagos', icon: <CreditCard size={18} /> },
  //{ label: 'Documentos', path: '/documentos', icon: <FileText size={18} /> },
  { label: 'Departamentos', path: '/departamentos', icon: <Map size={18} /> },
  { label: 'Municipios', path: '/municipios', icon: <MapPin size={18} /> },
  { label: 'Zonas', path: '/zonas', icon: <Layers size={18} /> },
  { label: 'Vías', path: '/vias', icon: <Navigation size={18} /> },
  { label: 'Tipos de Vía', path: '/tipos-via', icon: <Navigation size={18} /> },
  { label: 'Usuarios', path: '/usuarios', icon: <Shield size={18} />, roles: ['admin'] },
  { label: 'Auditoría', path: '/auditoria', icon: <ClipboardList size={18} />, roles: ['admin', 'editor'] },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.rol))
  );

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-amber-100 text-amber-800',
    editor: 'bg-emerald-100 text-emerald-800',
    consulta: 'bg-sky-100 text-sky-800',
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0f2744] z-30 transform transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-[#e8a020] rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <p className="font-heading text-white font-bold text-sm leading-tight">Catastro</p>
            <p className="text-white/50 text-xs">Municipal</p>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Menú de navegación">
          <ul className="space-y-0.5">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-[#e8a020] text-white shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#e8a020]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#e8a020] text-xs font-bold">
                {user?.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.nombre}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleBadgeColor[user?.rol ?? 'consulta']}`}>
                {user?.rol}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header
          className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b transition-all duration-200
            ${scrolled ? 'bg-white shadow-sm border-slate-200' : 'bg-white/80 backdrop-blur-md border-slate-100'}`}
        >
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-600 hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={sidebarOpen}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-slate-800 font-heading font-semibold text-base">
                {filteredNav.find((n) => n.path === location.pathname)?.label ?? 'Sistema de Catastro'}
              </h1>
              <p className="text-slate-400 text-xs">Sistema Municipal de Catastro</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all duration-200"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 bg-[#0f2744] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-slate-700 text-sm font-medium hidden sm:block">{user?.nombre}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Sesión activa</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}