import React, { Suspense, lazy } from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './src/components/Layout';
import { useAuthStore } from './src/store/authStore';


const Login = lazy(() => import('./src/pages/Login'));
const Home = lazy(() => import('./src/pages/Home'));
const Dashboard = lazy(() => import('./src/pages/Dashboard'));
const Departamentos = lazy(() => import('./src/pages/Departamentos'));
const Municipios = lazy(() => import('./src/pages/Municipios'));
const TiposVia = lazy(() => import('./src/pages/TiposVia'));
const Zonas = lazy(() => import('./src/pages/Zonas'));
const Vias = lazy(() => import('./src/pages/Vias'));
const Propietarios = lazy(() => import('./src/pages/Propietarios'));
const Inmuebles = lazy(() => import('./src/pages/Inmuebles'));
const Documentos = lazy(() => import('./src/pages/Documentos'));
const Pagos = lazy(() => import('./src/pages/Pagos'));
const Usuarios = lazy(() => import('./src/pages/Usuarios'));
const AuditoriaPage = lazy(() => import('./src/pages/Auditoria'));
const NotFound = lazy(() => import('./src/pages/NotFound'));

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-2 border-[#0f2744]/20 border-t-[#0f2744] rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inmuebles" element={<ProtectedRoute><Inmuebles /></ProtectedRoute>} />
            <Route path="/propietarios" element={<ProtectedRoute><Propietarios /></ProtectedRoute>} />
          {/*<Route path="/pagos" element={<ProtectedRoute><Pagos /></ProtectedRoute>} />*/}
            <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
            {/*<Route path="/departamentos" element={<ProtectedRoute><Departamentos /></ProtectedRoute>} />*/}
            <Route path="/municipios" element={<ProtectedRoute><Municipios /></ProtectedRoute>} />
            <Route path="/zonas" element={<ProtectedRoute><Zonas /></ProtectedRoute>} />
            <Route path="/vias" element={<ProtectedRoute><Vias /></ProtectedRoute>} />
            <Route path="/tipos-via" element={<ProtectedRoute><TiposVia /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute roles={['admin']}><Usuarios /></ProtectedRoute>} />
            <Route path="/auditoria" element={<ProtectedRoute roles={['admin', 'editor']}><AuditoriaPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover />
      </Router>
    </Theme>
  );
};

export default App;