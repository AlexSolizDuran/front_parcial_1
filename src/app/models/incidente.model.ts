export type EstadoIncidente = 
  | 'reportado' 
  | 'asignado' 
  | 'en_camino' 
  | 'en_sitio' 
  | 'finalizado' 
  | 'cancelado';

export type PrioridadIncidente = 
  | 'baja' 
  | 'media' 
  | 'alta' 
  | 'urgente';

export type EstadoHistoria = 
  | 'recibido' 
  | 'en_revision' 
  | 'asignado' 
  | 'en_atencion' 
  | 'completado' 
  | 'cancelado';

export interface Incidente {
  id: number;
  cliente_id: number;
  vehiculo_id?: number;
  ubicacion_lat: number;
  ubicacion_lng: number;
  especialidad_ia?: string;
  descripcion_ia?: string;
  prioridad?: PrioridadIncidente;
  estado: EstadoIncidente;
  descripcion_original?: string;
  descripcion?: string;
  requiere_mas_evidencia?: number;
  mensaje_solicitud?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface IncidenteCreate {
  cliente_id: number;
  vehiculo_id?: number;
  ubicacion_lat: number;
  ubicacion_lng: number;
  descripcion_original?: string;
}

export interface Evidencia {
  id: number;
  incidente_id: number;
  tipo: 'foto' | 'audio' | 'texto';
  url_archivo?: string;
  contenido?: string;
  transcripcion?: string;
  descripcion?: string;
  fecha_subida: string;
}

export interface EvidenciaCreate {
  incidente_id: number;
  tipo: 'foto' | 'audio' | 'texto';
  url_archivo?: string;
  contenido?: string;
}

export interface HistoriaIncidente {
  id: number;
  incidente_id: number;
  titulo: string;
  descripcion?: string;
  fecha_hora: string;
}

export interface HistoriaIncidenteCreate {
  titulo: string;
  descripcion?: string;
}

export interface Asignacion {
  id: number;
  incidente_id: number;
  taller_id: number;
  tecnico_id?: number;
  estado: string;
  fecha_asignacion: string;
  fecha_aceptacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface IncidenteCompleto {
  incidente: Incidente;
  evidencias: Evidencia[];
  historial: HistoriaIncidente[];
  asignaciones: Asignacion[];
  total_evidencias: number;
  tiene_foto: boolean;
  tiene_audio: boolean;
}

export interface IncidenteStats {
  especialidad_ia: string;
  descripcion_ia: string;
  prioridad: PrioridadIncidente;
}