import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Incidente, IncidenteCreate, IncidenteCompleto, Evidencia, HistoriaIncidente, HistoriaIncidenteCreate } from '../models/incidente.model';

@Injectable({
  providedIn: 'root'
})
export class IncidenteService {
  private apiUrl = `${environment.apiUrl}/incidentes`;
  
  private _incidentes = signal<Incidente[]>([]);
  private _incidenteActual = signal<IncidenteCompleto | null>(null);
  private _loading = signal(false);

  get incidentes() {
    return this._incidentes.asReadonly();
  }

  get incidenteActual() {
    return this._incidenteActual.asReadonly();
  }

  get loading() {
    return this._loading.asReadonly();
  }

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  crearIncidente(incidente: IncidenteCreate): Observable<Incidente> {
    return this.http.post<Incidente>(this.apiUrl, incidente, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.obtenerMisIncidentes().subscribe())
    );
  }

  obtenerMisIncidentes(skip: number = 0, limit: number = 100): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.apiUrl}/mis-incidentes?skip=${skip}&limit=${limit}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(incidentes => this._incidentes.set(incidentes))
    );
  }

  obtenerIncidentesTaller(tallerId: number, estado?: string): Observable<Incidente[]> {
    let url = `${this.apiUrl}/taller/${tallerId}`;
    if (estado) {
      url += `?estado=${estado}`;
    }
    return this.http.get<Incidente[]>(url, {
      headers: this.getHeaders()
    });
  }

  obtenerIncidente(id: number): Observable<Incidente> {
    return this.http.get<Incidente>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  obtenerEstadisticas(id: number): Observable<IncidenteCompleto> {
    return this.http.get<IncidenteCompleto>(`${this.apiUrl}/${id}/estadisticas`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this._incidenteActual.set(data))
    );
  }

  obtenerHistoria(id: number): Observable<HistoriaIncidente[]> {
    return this.http.get<HistoriaIncidente[]>(`${this.apiUrl}/${id}/historia`, {
      headers: this.getHeaders()
    });
  }

  crearHistoria(incidenteId: number, historia: HistoriaIncidenteCreate): Observable<HistoriaIncidente> {
    return this.http.post<HistoriaIncidente>(`${this.apiUrl}/${incidenteId}/historia`, historia, {
      headers: this.getHeaders()
    });
  }

  // Note: File upload would need to use FormData in a real implementation
  subirEvidencia(incidenteId: number, archivo: File, tipo: 'foto' | 'audio'): Observable<Evidencia> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', tipo);
    
    return this.http.post<Evidencia>(
      `${this.apiUrl}/${incidenteId}/evidencias`,
      formData,
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        })
      }
    );
  }

  asignarIncidente(incidenteId: number, tallerId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${incidenteId}/asignar`,
      { taller_id: tallerId },
      { headers: this.getHeaders() }
    );
  }

  // Methods for incident state management
  aceptarIncidente(asignacionId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/asignaciones/${asignacionId}/aceptar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rechazarIncidente(asignacionId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/asignaciones/${asignacionId}/rechazar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Clear current incident data
  limpiarActual() {
    this._incidenteActual.set(null);
  }
}