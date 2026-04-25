import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  fecha_envio: string;
  leido: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/usuarios/notificacion`;
  
  private _notificaciones = signal<Notificacion[]>([]);
  private _loading = signal(false);
  
  notificaciones = this._notificaciones.asReadonly();
  loading = this._loading.asReadonly();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerMisNotificaciones(skip: number = 0, limit: number = 50): Observable<Notificacion[]> {
    this._loading.set(true);
    return this.http.get<Notificacion[]>(
      `${this.apiUrl}/mis-notificaciones/?skip=${skip}&limit=${limit}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap({
        next: (notificaciones) => {
          this._notificaciones.set(notificaciones);
          this._loading.set(false);
        },
        error: () => this._loading.set(false)
      })
    );
  }

  marcarComoLeida(id: number): Observable<Notificacion> {
    return this.http.put<Notificacion>(
      `${this.apiUrl}/${id}/leer`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap((notificacion) => {
        const actuales = this._notificaciones();
        const actualizadas = actuales.map(n => 
          n.id === id ? { ...n, leido: true } : n
        );
        this._notificaciones.set(actualizadas);
      })
    );
  }

  eliminarNotificacion(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        const actuales = this._notificaciones();
        const filtradas = actuales.filter(n => n.id !== id);
        this._notificaciones.set(filtradas);
      })
    );
  }

  agregarNotificacionLocal(notificacion: Notificacion): void {
    const actuales = this._notificaciones();
    this._notificaciones.set([notificacion, ...actuales]);
  }

  getNotificacionesNoLeidas(): number {
    return this._notificaciones().filter(n => !n.leido).length;
  }
}