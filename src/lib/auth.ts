import type { AuthUser } from '../types';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Credenciales incorrectas');
  }

  // Tu backend devuelve { token, usuario }
  // Lo aplanamos al formato que espera el frontend: { ...usuario, token }
  return {
    ...data.usuario,
    token: data.token,
  };
}

export async function getMe(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Sesión expirada');

  const data = await response.json();
  return data;
}
/*
const MOCK_USERS = [
  { id: 1, nombre: 'Administrador Sistema', email: 'admin@catastro.gob.gt', password: 'admin123', rol: 'admin' as const, activo: true, creado_en: '2024-01-01T00:00:00Z' },
  { id: 2, nombre: 'Editor Catastral', email: 'editor@catastro.gob.gt', password: 'editor123', rol: 'editor' as const, activo: true, creado_en: '2024-01-10T00:00:00Z' },
  { id: 3, nombre: 'Consultor Externo', email: 'consulta@catastro.gob.gt', password: 'consulta123', rol: 'consulta' as const, activo: true, creado_en: '2024-02-01T00:00:00Z' },
];

function generateMockJWT(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 86400000 }));
  const signature = btoa('mock-signature');
  return `${header}.${body}.${signature}`;
}

export function verifyMockJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 800));
  const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error('Credenciales incorrectas');
  if (!user.activo) throw new Error('Usuario inactivo');
  const { password: _, ...userWithoutPassword } = user;
  const token = generateMockJWT({ sub: user.id, email: user.email, rol: user.rol });
  return { ...userWithoutPassword, token };
}*/