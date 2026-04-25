export interface HistorialTaller {
  id: number;
  taller_id: number;
  titulo: string;
  descripcion: string;
  tipo: 'incidente_llegada' | 'incidente_aceptado' | 'incidente_rechazado' | 'tecnico_termino' | 'info';
  fecha: string;
}

export interface HistorialTallerCreate {
  titulo: string;
  descripcion: string;
  tipo: string;
}