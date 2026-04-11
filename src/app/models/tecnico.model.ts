export interface Tecnico {
  id: number;
  taller_id: number | null;
  usuario_id: number;
  disponible: boolean;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    username: string;
  };
}

export interface CreateTecnico {
  disponible: boolean;
}
