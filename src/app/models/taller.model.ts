export interface Taller {
  id: number;
  nombre: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  especialidad: string;
  telefono?: string;
  horario_atencion?: string;
  dueño_id: number;
}

export interface TallerCreate {
  nombre: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  especialidad: string;
  telefono?: string;
  horario_atencion?: string;
}

export interface TallerUpdate {
  nombre?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  especialidad?: string;
  telefono?: string;
  horario_atencion?: string;
}
