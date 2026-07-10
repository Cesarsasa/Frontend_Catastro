import type {
  Departamento, Municipio, TipoVia, Zona, Via,
  Propietario, Inmueble, Documento, Pago, Auditoria, Usuario
} from '../types';

export const mockDepartamentos: Departamento[] = [
  { id: 1, codigo: 'GT01', nombre: 'Guatemala', creado_en: '2024-01-01T00:00:00Z' },
  { id: 2, codigo: 'GT02', nombre: 'Sacatepéquez', creado_en: '2024-01-01T00:00:00Z' },
  { id: 3, codigo: 'GT03', nombre: 'Chimaltenango', creado_en: '2024-01-01T00:00:00Z' },
];

export const mockMunicipios: Municipio[] = [
  { id: 1, departamento_id: 1, codigo: 'MUN01', nombre: 'Guatemala Ciudad', creado_en: '2024-01-01T00:00:00Z', departamento: mockDepartamentos[0] },
  { id: 2, departamento_id: 1, codigo: 'MUN02', nombre: 'Mixco', creado_en: '2024-01-01T00:00:00Z', departamento: mockDepartamentos[0] },
  { id: 3, departamento_id: 2, codigo: 'MUN03', nombre: 'Antigua Guatemala', creado_en: '2024-01-01T00:00:00Z', departamento: mockDepartamentos[1] },
];

export const mockTiposVia: TipoVia[] = [
  { id: 1, nombre: 'Avenida' },
  { id: 2, nombre: 'Calle' },
  { id: 3, nombre: 'Boulevard' },
  { id: 4, nombre: 'Callejón' },
];

export const mockZonas: Zona[] = [
  { id: 1, municipio_id: 1, numero: 1, nombre: 'Zona 1 Centro Histórico', creado_en: '2024-01-01T00:00:00Z', municipio: mockMunicipios[0] },
  { id: 2, municipio_id: 1, numero: 4, nombre: 'Zona 4', creado_en: '2024-01-01T00:00:00Z', municipio: mockMunicipios[0] },
  { id: 3, municipio_id: 1, numero: 10, nombre: 'Zona 10 Cayalá', creado_en: '2024-01-01T00:00:00Z', municipio: mockMunicipios[0] },
  { id: 4, municipio_id: 2, numero: 1, nombre: 'Zona 1 Mixco', creado_en: '2024-01-01T00:00:00Z', municipio: mockMunicipios[1] },
];

export const mockVias: Via[] = [
  { id: 1, municipio_id: 1, zona_id: 1, tipo_via_id: 1, numero: '6', nombre: '6a Avenida', creado_en: '2024-01-01T00:00:00Z', municipio: mockMunicipios[0], zona: mockZonas[0], tipo_via: mockTiposVia[0] },
  { id: 2, municipio_id: 1, zona_id: 1, tipo_via_id: 2, numero: '18', nombre: '18 Calle', creado_en: '2024-01-01T00:00:00Z', municipio: mockMunicipios[0], zona: mockZonas[0], tipo_via: mockTiposVia[1] },
  { id: 3, municipio_id: 1, zona_id: 3, tipo_via_id: 3, numero: '1', nombre: 'Boulevard Vista Hermosa', creado_en: '2024-01-01T00:00:00Z', municipio: mockMunicipios[0], zona: mockZonas[2], tipo_via: mockTiposVia[2] },
];

export const mockPropietarios: Propietario[] = [
  { id: 1, tipo: 'persona', nombre: 'Carlos Mendoza López', dpi: '1234567890101', nit: '12345678', telefono: '55551234', email: 'carlos@email.com', direccion: '6a Av 1-23 Zona 1', municipio_id: 1, zona_id: 1, via_id: 1, numero_casa: '23', colonia: 'Centro', creado_en: '2024-01-15T00:00:00Z', actualizado_en: '2024-01-15T00:00:00Z', municipio: mockMunicipios[0], zona: mockZonas[0], via: mockVias[0] },
  { id: 2, tipo: 'empresa', nombre: 'Inmobiliaria del Sur S.A.', nit: '87654321', telefono: '22221234', email: 'info@inmosur.com', direccion: 'Blvd Vista Hermosa 10-50 Zona 10', municipio_id: 1, zona_id: 3, via_id: 3, numero_casa: '50', colonia: 'Vista Hermosa', creado_en: '2024-02-01T00:00:00Z', actualizado_en: '2024-02-01T00:00:00Z', municipio: mockMunicipios[0], zona: mockZonas[2], via: mockVias[2] },
  { id: 3, tipo: 'persona', nombre: 'María Elena Pérez', dpi: '9876543210101', nit: '98765432', telefono: '44449876', email: 'maria@email.com', direccion: '18 Calle 5-67 Zona 1', municipio_id: 1, zona_id: 1, via_id: 2, numero_casa: '67', creado_en: '2024-03-10T00:00:00Z', actualizado_en: '2024-03-10T00:00:00Z', municipio: mockMunicipios[0], zona: mockZonas[0], via: mockVias[1] },
];

export const mockInmuebles: Inmueble[] = [
  { id: 1, codigo_catastral: 'CAT-2024-001', propietario_id: 1, municipio_id: 1, zona_id: 1, via_id: 1, numero_casa: '23', colonia: 'Centro', direccion_completa: '6a Av 1-23 Zona 1, Guatemala', tipo: 'urbano', uso: 'Residencial', area_m2: 250.50, area_registrada: 248.00, area_real: 250.50, valor_inscrito: 850000, no_inscripcion_iusi: 'IUSI-001-2024', finca: '1234', folio: '56', libro: '78', departamento_registro: 'Guatemala', estado: 'activo', creado_en: '2024-01-15T00:00:00Z', actualizado_en: '2024-01-15T00:00:00Z', propietario: mockPropietarios[0], municipio: mockMunicipios[0], zona: mockZonas[0] },
  { id: 2, codigo_catastral: 'CAT-2024-002', propietario_id: 2, municipio_id: 1, zona_id: 3, via_id: 3, numero_casa: '50', colonia: 'Vista Hermosa', direccion_completa: 'Blvd Vista Hermosa 10-50 Zona 10', tipo: 'comercial', uso: 'Oficinas', area_m2: 1200.00, area_registrada: 1200.00, area_real: 1200.00, valor_inscrito: 5500000, no_inscripcion_iusi: 'IUSI-002-2024', finca: '5678', folio: '12', libro: '34', departamento_registro: 'Guatemala', estado: 'activo', creado_en: '2024-02-01T00:00:00Z', actualizado_en: '2024-02-01T00:00:00Z', propietario: mockPropietarios[1], municipio: mockMunicipios[0], zona: mockZonas[2] },
  { id: 3, codigo_catastral: 'CAT-2024-003', propietario_id: 3, municipio_id: 1, zona_id: 1, via_id: 2, numero_casa: '67', direccion_completa: '18 Calle 5-67 Zona 1', tipo: 'urbano', uso: 'Residencial', area_m2: 180.00, valor_inscrito: 420000, estado: 'en_proceso', creado_en: '2024-03-10T00:00:00Z', actualizado_en: '2024-03-10T00:00:00Z', propietario: mockPropietarios[2], municipio: mockMunicipios[0], zona: mockZonas[0] },
];

export const mockDocumentos: Documento[] = [
  { id: 1, inmueble_id: 1, propietario_id: 1, tipo: 'escritura', nombre: 'Escritura Pública No. 45', ruta_s3: 's3://catastro/docs/escritura-001.pdf', url: 'https://example.com/docs/escritura-001.pdf', tamano_bytes: 2048000, mime_type: 'application/pdf', subido_por: 1, creado_en: '2024-01-16T00:00:00Z' },
  { id: 2, inmueble_id: 1, tipo: 'plano', nombre: 'Plano Arquitectónico', ruta_s3: 's3://catastro/docs/plano-001.pdf', url: 'https://example.com/docs/plano-001.pdf', tamano_bytes: 5120000, mime_type: 'application/pdf', subido_por: 1, creado_en: '2024-01-17T00:00:00Z' },
  { id: 3, inmueble_id: 2, tipo: 'certificacion', nombre: 'Certificación Registral', ruta_s3: 's3://catastro/docs/cert-002.pdf', url: 'https://example.com/docs/cert-002.pdf', tamano_bytes: 1024000, mime_type: 'application/pdf', subido_por: 2, creado_en: '2024-02-05T00:00:00Z' },
];

export const mockPagos: Pago[] = [
  { id: 1, inmueble_id: 1, anio: 2024, trimestre: 1, monto: 850, estado: 'pagado', fecha_pago: '2024-01-31T00:00:00Z', metodo_pago: 'Efectivo', num_recibo: 'REC-2024-001', creado_en: '2024-01-31T00:00:00Z', inmueble: mockInmuebles[0] },
  { id: 2, inmueble_id: 1, anio: 2024, trimestre: 2, monto: 850, estado: 'pagado', fecha_pago: '2024-04-30T00:00:00Z', metodo_pago: 'Transferencia', num_recibo: 'REC-2024-002', creado_en: '2024-04-30T00:00:00Z', inmueble: mockInmuebles[0] },
  { id: 3, inmueble_id: 2, anio: 2024, trimestre: 1, monto: 5500, estado: 'pagado', fecha_pago: '2024-02-15T00:00:00Z', metodo_pago: 'Cheque', num_recibo: 'REC-2024-003', creado_en: '2024-02-15T00:00:00Z', inmueble: mockInmuebles[1] },
  { id: 4, inmueble_id: 3, anio: 2024, trimestre: 1, monto: 420, estado: 'moroso', creado_en: '2024-04-01T00:00:00Z', inmueble: mockInmuebles[2] },
];

export const mockUsuarios: Usuario[] = [
  { id: 1, nombre: 'Administrador Sistema', email: 'admin@catastro.gob.gt', rol: 'admin', activo: true, creado_en: '2024-01-01T00:00:00Z' },
  { id: 2, nombre: 'Editor Catastral', email: 'editor@catastro.gob.gt', rol: 'editor', activo: true, creado_en: '2024-01-10T00:00:00Z' },
  { id: 3, nombre: 'Consultor Externo', email: 'consulta@catastro.gob.gt', rol: 'consulta', activo: true, creado_en: '2024-02-01T00:00:00Z' },
];

export const mockAuditorias: Auditoria[] = [
  { id: 1, tabla: 'inmuebles', registro_id: 1, accion: 'INSERT', datos_despues: { codigo_catastral: 'CAT-2024-001' }, usuario_id: 1, ip: '192.168.1.1', creado_en: '2024-01-15T10:30:00Z', usuario: mockUsuarios[0] },
  { id: 2, tabla: 'propietarios', registro_id: 1, accion: 'UPDATE', datos_antes: { telefono: '55550000' }, datos_despues: { telefono: '55551234' }, usuario_id: 2, ip: '192.168.1.2', creado_en: '2024-01-20T14:15:00Z', usuario: mockUsuarios[1] },
  { id: 3, tabla: 'pagos', registro_id: 1, accion: 'INSERT', datos_despues: { monto: 850, estado: 'pagado' }, usuario_id: 1, ip: '192.168.1.1', creado_en: '2024-01-31T09:00:00Z', usuario: mockUsuarios[0] },
];