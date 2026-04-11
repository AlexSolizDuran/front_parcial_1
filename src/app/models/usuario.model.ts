export enum RolEnum {
  cliente = 'cliente',
  dueno = 'dueno',
  tecnico = 'tecnico',
}

export interface Usuario {
  id: number;
  email: string;
  username: string;
  nombre: string;
  telefono?: string;
  rol: RolEnum;
  created_at?: string;
  taller_id?: number | null;
  nombre_taller?: string | null;
}

export interface UsuarioCreate {
  email: string;
  username: string;
  nombre: string;
  telefono?: string;
  password: string;
  rol: RolEnum;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Usuario;
}
