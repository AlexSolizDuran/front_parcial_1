import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IncidenteAsignado,
  DetalleIncidente,
  TecnicoInfo,
  IncidentesDelDia
} from '../models/incidente-asignado.model';

export interface Evidencia {
  id: number;
  tipo: string;
  url_archivo?: string;
  contenido?: string;
  descripcion?: string;
  transcripcion?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
}

export interface Vehiculo {
  id: number;
  placa: string;
  marca?: string;
  modelo?: string;
}

export interface IncidenteDetalle {
  id: number;
  ubicacion_lat: number;
  ubicacion_lng: number;
  especialidad_ia?: string;
  descripcion_ia?: string;
  prioridad?: string;
  descripcion?: string;
  cliente: Cliente;
  vehiculo?: Vehiculo;
  evidencias: Evidencia[];
}

export interface AsignacionInfo {
  id: number;
  incidente_id: number;
  taller_id: number;
  tecnico_id?: number;
  estado: string;
  fecha_asignacion: string;
  fecha_expiracion?: string;
  fecha_aceptacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface AsignacionPendiente {
  asignacion: AsignacionInfo;
  incidente: IncidenteDetalle;
  tiempo_restante_segundos: number;
}

@Injectable({
  providedIn: 'root'
})
export class IncidenteTallerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/incidentes`;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerAsignacionPendiente(tallerId: number): Observable<AsignacionPendiente | null> {
    return this.http.get<AsignacionPendiente | null>(
      `${environment.apiUrl}/asignaciones/taller/${tallerId}/pendiente`,
      { headers: this.getHeaders() }
    );
  }

  aceptarAsignacion(asignacionId: number): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/asignaciones/${asignacionId}/aceptar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rechazarAsignacion(asignacionId: number): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/asignaciones/${asignacionId}/rechazar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  obtenerIncidentesAsignados(tallerId: number): Observable<IncidenteAsignado[]> {
    return this.http.get<IncidenteAsignado[]>(
      `${this.apiUrl}/taller/${tallerId}/asignados`,
      { headers: this.getHeaders() }
    );
  }

  obtenerDetalleIncidente(incidenteId: number): Observable<DetalleIncidente> {
    const url = `${this.apiUrl}/${incidenteId}/detalle-asignado`;
    console.log('Llamando a API:', url);
    return this.http.get<DetalleIncidente>(
      url,
      { headers: this.getHeaders() }
    );
  }

  obtenerIncidentesDelDia(tallerId: number): Observable<IncidentesDelDia> {
    return this.http.get<IncidentesDelDia>(
      `${this.apiUrl}/taller/${tallerId}/del-dia`,
      { headers: this.getHeaders() }
    );
  }

  cambiarEstadoIncidente(
    incidenteId: number,
    nuevoEstado: string
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${incidenteId}/estado`,
      { estado: nuevoEstado },
      { headers: this.getHeaders() }
    );
  }

  obtenerTecnicosTaller(tallerId: number): Observable<TecnicoInfo[]> {
    const tecnicosUrl = `${environment.apiUrl}/usuarios/tecnicos/taller/${tallerId}`;
    return this.http.get<TecnicoInfo[]>(tecnicosUrl, {
      headers: this.getHeaders()
    });
  }

  obtenerTecnicosDisponibles(tallerId: number): Observable<TecnicoInfo[]> {
    const url = `${environment.apiUrl}/usuarios/tecnicos/taller/${tallerId}/disponibles`;
    return this.http.get<TecnicoInfo[]>(url, {
      headers: this.getHeaders()
    });
  }

  asignarTecnicoIncidente(
    incidenteId: number,
    tecnicoId: number
  ): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/asignaciones/aceptar-y-asignar`,
      {
        incidente_id: incidenteId,
        tecnico_id: tecnicoId
      },
      { headers: this.getHeaders() }
    );
  }

  getColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'reportado': 'bg-yellow-100 text-yellow-800',
      'asignado': 'bg-blue-100 text-blue-800',
      'en_camino': 'bg-orange-100 text-orange-800',
      'en_sitio': 'bg-green-100 text-green-800',
      'finalizado': 'bg-gray-100 text-gray-600',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  getLabelEstado(estado: string): string {
    const labels: Record<string, string> = {
      'reportado': 'Reportado',
      'asignado': 'Asignado',
      'en_camino': 'En camino',
      'en_sitio': 'En sitio',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado'
    };
    return labels[estado] || estado;
  }

  getColorPrioridad(prioridad: string | null): string {
    if (!prioridad) return 'bg-gray-100 text-gray-800';
    const colores: Record<string, string> = {
      'urgente': 'bg-red-100 text-red-800',
      'alta': 'bg-orange-100 text-orange-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'baja': 'bg-green-100 text-green-800'
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-800';
  }

  getLabelPrioridad(prioridad: string | null | undefined): string {
    if (!prioridad) return 'Sin prioridad';
    const labels: Record<string, string> = {
      'urgente': 'Urgente',
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja'
    };
    return labels[prioridad] || prioridad;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isToday(dateStr: string): boolean {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
}