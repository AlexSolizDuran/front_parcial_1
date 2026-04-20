import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Taller, TallerCreate, TallerUpdate, Especialidad } from '../models/taller.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TallerService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/activos/taller`;
  private apiUrlEsp = `${environment.apiUrl}/activos/especialidades`;

  private _taller = signal<Taller | null>(null);
  private _loading = signal(false);
  private _showModal = signal(false);
  private _especialidades = signal<Especialidad[]>([]);

  taller = this._taller.asReadonly();
  loading = this._loading.asReadonly();
  showModal = this._showModal.asReadonly();
  especialidades = this._especialidades.asReadonly();

  obtenerEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(`${this.apiUrlEsp}/`).pipe(
      tap((esp) => this._especialidades.set(esp))
    );
  }

  crearEspecialidad(data: { nombre: string; descripcion?: string }): Observable<Especialidad> {
    return this.http.post<Especialidad>(`${this.apiUrlEsp}/`, data).pipe(
      tap((esp) => {
        this._especialidades.update((list) => [...list, esp]);
      })
    );
  }

  eliminarEspecialidad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlEsp}/${id}`).pipe(
      tap(() => {
        this._especialidades.update((list) => list.filter((e) => e.id !== id));
      })
    );
  }

  actualizarEspecialidadesTaller(tallerId: number, especialidades: number[]): Observable<Taller> {
    return this.http.put<Taller>(`${this.apiUrl}/${tallerId}/especialidades`, especialidades).pipe(
      tap((taller) => this._taller.set(taller))
    );
  }

  checkMiTaller(): Observable<Taller | null> {
    this._loading.set(true);

    return this.http.get<Taller>(`${this.apiUrl}/mi-taller/`).pipe(
      tap({
        next: (taller) => {
          this._loading.set(false);
          this._taller.set(taller);
          this._showModal.set(false);
        },
        error: (err) => {
          this._loading.set(false);
          if (err.status === 404) {
            this._taller.set(null);
            this._showModal.set(true);
          }
        },
      }),
      catchError(() => {
        this._loading.set(false);
        return of(null);
      }),
    );
  }

  crearTaller(data: TallerCreate): Observable<Taller> {
    this._loading.set(true);

    return this.http.post<Taller>(`${this.apiUrl}/`, data).pipe(
      tap({
        next: (taller) => {
          this._loading.set(false);
          this._taller.set(taller);
          this._showModal.set(false);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  actualizarTaller(tallerId: number, data: TallerUpdate): Observable<Taller> {
    this._loading.set(true);

    return this.http.put<Taller>(`${this.apiUrl}/${tallerId}`, data).pipe(
      tap({
        next: (taller) => {
          this._loading.set(false);
          this._taller.set(taller);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  get showModalTaller() {
    return this._showModal;
  }

  reset() {
    this._taller.set(null);
    this._showModal.set(false);
  }
}