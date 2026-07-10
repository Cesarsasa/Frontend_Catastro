import type { User, Owner, Property, Document } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'Carlos Mendoza', email: 'carlos@municipio.gob', role: 'admin', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: 'Ana Torres', email: 'ana@municipio.gob', role: 'operator', status: 'active', createdAt: '2024-02-20' },
  { id: '3', name: 'Luis Quispe', email: 'luis@municipio.gob', role: 'operator', status: 'active', createdAt: '2024-03-10' },
  { id: '4', name: 'María Flores', email: 'maria@municipio.gob', role: 'viewer', status: 'inactive', createdAt: '2024-04-05' },
  { id: '5', name: 'Jorge Ramírez', email: 'jorge@municipio.gob', role: 'viewer', status: 'active', createdAt: '2024-05-18' },
];

export const mockOwners: Owner[] = [
  { id: '1', fullName: 'Roberto Silva Paredes', documentType: 'DNI', documentNumber: '45678901', phone: '987654321', email: 'roberto@email.com', address: 'Av. Principal 123', status: 'active', createdAt: '2024-01-10' },
  { id: '2', fullName: 'Empresa Constructora SAC', documentType: 'RUC', documentNumber: '20512345678', phone: '012345678', email: 'info@constructora.com', address: 'Jr. Comercio 456', status: 'active', createdAt: '2024-02-14' },
  { id: '3', fullName: 'Carmen López Vega', documentType: 'DNI', documentNumber: '32109876', phone: '976543210', email: 'carmen@email.com', address: 'Calle Los Pinos 789', status: 'active', createdAt: '2024-03-22' },
  { id: '4', fullName: 'Pedro Huanca Mamani', documentType: 'DNI', documentNumber: '67890123', phone: '965432109', email: 'pedro@email.com', address: 'Psje. Las Flores 12', status: 'inactive', createdAt: '2024-04-30' },
  { id: '5', fullName: 'Inversiones Norte EIRL', documentType: 'RUC', documentNumber: '20698765432', phone: '014567890', email: 'norte@inversiones.com', address: 'Av. Industrial 567', status: 'active', createdAt: '2024-05-08' },
];

export const mockProperties: Property[] = [
  { id: '1', cadastralCode: 'CAT-2024-001', address: 'Av. Principal 123, Miraflores', district: 'Miraflores', area: 250, builtArea: 180, propertyType: 'residential', status: 'registered', ownerId: '1', ownerName: 'Roberto Silva Paredes', selfAssessment: 450000, createdAt: '2024-01-20' },
  { id: '2', cadastralCode: 'CAT-2024-002', address: 'Jr. Comercio 456, Centro', district: 'Cercado', area: 500, builtArea: 420, propertyType: 'commercial', status: 'registered', ownerId: '2', ownerName: 'Empresa Constructora SAC', selfAssessment: 1200000, createdAt: '2024-02-15' },
  { id: '3', cadastralCode: 'CAT-2024-003', address: 'Calle Los Pinos 789, San Borja', district: 'San Borja', area: 180, builtArea: 0, propertyType: 'land', status: 'pending', ownerId: '3', ownerName: 'Carmen López Vega', selfAssessment: 320000, createdAt: '2024-03-25' },
  { id: '4', cadastralCode: 'CAT-2024-004', address: 'Av. Industrial 567, Ate', district: 'Ate', area: 1200, builtArea: 900, propertyType: 'industrial', status: 'disputed', ownerId: '5', ownerName: 'Inversiones Norte EIRL', selfAssessment: 2800000, createdAt: '2024-04-10' },
  { id: '5', cadastralCode: 'CAT-2024-005', address: 'Psje. Las Flores 12, Surco', district: 'Surco', area: 120, builtArea: 95, propertyType: 'residential', status: 'registered', ownerId: '4', ownerName: 'Pedro Huanca Mamani', selfAssessment: 210000, createdAt: '2024-05-12' },
];

export const mockDocuments: Document[] = [
  { id: '1', title: 'Escritura Pública - Av. Principal 123', type: 'deed', propertyId: '1', propertyCode: 'CAT-2024-001', ownerId: '1', ownerName: 'Roberto Silva Paredes', fileSize: '2.4 MB', uploadedBy: 'Carlos Mendoza', status: 'active', createdAt: '2024-01-22' },
  { id: '2', title: 'Certificado de Parámetros - Jr. Comercio 456', type: 'certificate', propertyId: '2', propertyCode: 'CAT-2024-002', ownerId: '2', ownerName: 'Empresa Constructora SAC', fileSize: '1.1 MB', uploadedBy: 'Ana Torres', status: 'active', createdAt: '2024-02-18' },
  { id: '3', title: 'Licencia de Construcción - Calle Los Pinos', type: 'permit', propertyId: '3', propertyCode: 'CAT-2024-003', ownerId: '3', ownerName: 'Carmen López Vega', fileSize: '3.7 MB', uploadedBy: 'Luis Quispe', status: 'pending', createdAt: '2024-03-28' },
  { id: '4', title: 'Informe Técnico - Av. Industrial 567', type: 'report', propertyId: '4', propertyCode: 'CAT-2024-004', ownerId: '5', ownerName: 'Inversiones Norte EIRL', fileSize: '5.2 MB', uploadedBy: 'Carlos Mendoza', status: 'active', createdAt: '2024-04-15' },
  { id: '5', title: 'Escritura Pública - Psje. Las Flores 12', type: 'deed', propertyId: '5', propertyCode: 'CAT-2024-005', ownerId: '4', ownerName: 'Pedro Huanca Mamani', fileSize: '1.8 MB', uploadedBy: 'Ana Torres', status: 'archived', createdAt: '2024-05-14' },
];