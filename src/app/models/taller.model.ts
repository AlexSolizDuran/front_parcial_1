export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Taller {
  id: number;
  nombre: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  telefono?: string;
  horario_atencion?: string;
  dueño_id: number;
  especialidades: Especialidad[];
}

export interface TallerCreate {
  nombre: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  telefono?: string;
  horario_atencion?: string;
  especialidades: number[];
}

export interface TallerUpdate {
  nombre?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  telefono?: string;
  horario_atencion?: string;
  especialidades?: number[];
}