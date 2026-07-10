export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'editor' | 'consulta';
  activo?: boolean;
  creado_en?: string;
  token: string; // ← esto es clave
}

/*export interface Propietario {
  id: number;
  tipo: 'persona' | 'empresa';
  nombre: string;
  dpi?: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  municipio_id?: number;
  zona_id?: number;
  via_id?: number;
  numero_casa?: string;
  colonia?: string;
  referencia?: string;
  observaciones?: string;
  creado_en: string;
  actualizado_en?: string;
  municipio?: { id: number; nombre: string };
  zona?: { id: number; numero: number; nombre: string };
  via?: { id: number; nombre?: string; numero: string; tipo_via?: { nombre: string }, zona?: { nombre: string }};
}*/