export interface Tecnico {
  id: number;
  taller_id: number | null;
  usuario_id: number;
  disponible: boolean;
  ubicacion_lat?: number | null;
  ubicacion_lng?: number | null;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    username: string;
  };
}

export interface TecnicoInfo {
  id: number;
  nombre?: string;
  telefono?: string;
  disponible: boolean;
  usuario?: {
    nombre?: string;
    telefono?: string;
  };
}

export interface CreateTecnico {
  disponible: boolean;
}
