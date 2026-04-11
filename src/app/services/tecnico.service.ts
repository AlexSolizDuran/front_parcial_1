import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Tecnico, CreateTecnico } from '../models/tecnico.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TecnicoService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/usuarios/tecnico`;

  private _tecnicos = signal<Tecnico[]>([]);
  private _loading = signal(false);

  tecnicos = this._tecnicos.asReadonly();
  loading = this._loading.asReadonly();

  getTecnicos(): Observable<Tecnico[]> {
    this._loading.set(true);

    return this.http.get<Tecnico[]>(`${this.apiUrl}/`).pipe(
      tap({
        next: (tecnicos) => {
          this._tecnicos.set(tecnicos);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  crearTecnico(data: CreateTecnico): Observable<Tecnico> {
    this._loading.set(true);

    return this.http.post<Tecnico>(`${this.apiUrl}/registrar`, data).pipe(
      tap({
        next: (tecnico) => {
          this._loading.set(false);
          this._tecnicos.update((list) => [...list, tecnico]);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  crearTecnicoConUsuarioId(usuarioId: number): Observable<Tecnico> {
    this._loading.set(true);

    return this.http
      .post<Tecnico>(`${this.apiUrl}/`, {
        disponible: true,
        usuario_id: usuarioId,
      })
      .pipe(
        tap({
          next: (tecnico) => {
            this._loading.set(false);
            this._tecnicos.update((list) => [...list, tecnico]);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  crearTecnicoParaTaller(): Observable<Tecnico> {
    this._loading.set(true);

    return this.http.post<Tecnico>(`${this.apiUrl}/`, { disponible: true }).pipe(
      tap({
        next: (tecnico) => {
          this._loading.set(false);
          this._tecnicos.update((list) => [...list, tecnico]);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  actualizarDisponibilidad(tecnicoId: number, disponible: boolean): Observable<Tecnico> {
    this._loading.set(true);

    return this.http
      .put<Tecnico>(`${this.apiUrl}/${tecnicoId}/disponibilidad?disponible=${disponible}`, {})
      .pipe(
        tap({
          next: (tecnico) => {
            this._loading.set(false);
            this._tecnicos.update((list) => list.map((t) => (t.id === tecnicoId ? tecnico : t)));
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  eliminarTecnico(tecnicoId: number): Observable<any> {
    this._loading.set(true);

    return this.http.delete(`${this.apiUrl}/${tecnicoId}`).pipe(
      tap({
        next: () => {
          this._loading.set(false);
          this._tecnicos.update((list) => list.filter((t) => t.id !== tecnicoId));
        },
        error: () => this._loading.set(false),
      }),
    );
  }
}
