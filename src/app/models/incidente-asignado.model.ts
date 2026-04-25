export interface Cliente {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
}

export interface Vehiculo {
  id: number;
  marca: string | null;
  modelo: string | null;
  patente: string | null;
  anio: number | null;
}

export interface TecnicoInfo {
  id: number;
  nombre?: string;
  telefono?: string;
  disponible: boolean;
  ubicacion_lat?: number | null;
  ubicacion_lng?: number | null;
  usuario?: {
    nombre?: string;
    telefono?: string;
  };
}

export interface Asignacion {
  id: number;
  tecnico_id: number;
  taller_id: number;
  estado: string;
  fecha_asignacion: string;
  fecha_aceptacion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  tecnico: TecnicoInfo | null;
}

export interface IncidenteAsignado {
  id: number;
  estado: string;
  prioridad: string;
  descripcion: string | null;
  descripcion_ia: string | null;
  ubicacion_lat: number;
  ubicacion_lng: number;
  especialidad_ia: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  cliente: Cliente | null;
  vehiculo: Vehiculo | null;
  asignacion: Asignacion | null;
  total_evidencias: number;
}

export interface Evidencia {
  id: number;
  tipo: 'foto' | 'audio' | 'texto';
  url_archivo: string | null;
  contenido: string | null;
  transcripcion: string | null;
  descripcion: string | null;
  fecha_subida: string | null;
}

export interface HistorialItem {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_hora: string | null;
}

export interface DetalleIncidente {
  id: number;
  estado: string;
  prioridad: string;
  descripcion: string | null;
  descripcion_ia: string | null;
  descripcion_original: string | null;
  especialidad_ia: string | null;
  requiere_mas_evidencia: number;
  mensaje_solicitud: string | null;
  ubicacion_lat: number;
  ubicacion_lng: number;
  fecha_creacion: string;
  cliente: Cliente | null;
  vehiculo: Vehiculo | null;
  tecnico: TecnicoInfo | null;
  asignacion: Asignacion | null;
  evidencias: Evidencia[];
  historial: HistorialItem[];
}

export interface IncidentesDelDia {
  total_hoy: number;
  activos: number;
  finalizados: number;
  incidentes: IncidenteAsignado[];
}