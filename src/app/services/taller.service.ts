import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Taller, TallerCreate, TallerUpdate } from '../models/taller.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TallerService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/activos/taller`;

  private _taller = signal<Taller | null>(null);
  private _loading = signal(false);
  private _showModal = signal(false);

  taller = this._taller.asReadonly();
  loading = this._loading.asReadonly();
  showModal = this._showModal.asReadonly();

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
