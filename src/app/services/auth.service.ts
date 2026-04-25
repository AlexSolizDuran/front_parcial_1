import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Usuario, UsuarioCreate, LoginRequest } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = `${environment.apiUrl}/usuarios/usuario`;

  private _user = signal<Usuario | null>(null);
  private _token = signal<string | null>(null);
  private _loading = signal(false);

  user = this._user.asReadonly();
  token = this._token.asReadonly();
  loading = this._loading.asReadonly();

  isAuthenticated = computed(() => !!this._token());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          this._token.set(token);
          this._user.set(userData);
        } catch (e) {
          this.logout();
        }
      }
    }
  }

  login(credentials: LoginRequest): Observable<Usuario> {
    this._loading.set(true);
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    return this.http
      .post<any>(`${this.apiUrl}/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        switchMap((response) => {
          this._token.set(response.access_token);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', response.access_token);
          }
          return this.http.get<Usuario>(`${this.apiUrl}/me/taller`);
        }),
        tap({
          next: (user) => {
            const userWithTaller: Usuario = {
              ...user,
              taller_id: user.taller_id || null,
              nombre_taller: user.nombre_taller || null,
            };
            this._user.set(userWithTaller);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('user', JSON.stringify(userWithTaller));
            }
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  register(data: UsuarioCreate): Observable<any> {
    this._loading.set(true);
    return this.http.post<any>(`${this.apiUrl}/register`, data).pipe(
      tap({
        next: (user) => this._loading.set(false),
        error: () => this._loading.set(false),
      }),
    );
  }

  actualizarUsuario(
    id: number,
    data: { nombre?: string; email?: string; telefono?: string },
  ): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      tap({
        next: () => console.log('Usuario actualizado'),
        error: (err) => console.error('Error al actualizar usuario', err),
      }),
    );
  }

  eliminarUsuario(id: number): Observable<any> {
    console.log('lo que se eliminara');
    console.log(id);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => console.log('Usuario eliminado'),
        error: (err) => console.error('Error al eliminar usuario', err),
      }),
    );
  }

  getUsuarioPorUsername(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?username=${username}`).pipe(
      tap((users) => {
        console.log('Users found:', users);
      }),
    );
  }

  logout(navigate: boolean = true) {
    this._token.set(null);
    this._user.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return this._token();
  }
}
