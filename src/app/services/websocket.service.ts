import { Injectable, signal, inject, OnDestroy, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, Subject, EMPTY } from 'rxjs';
import { catchError, takeUntil, tap, switchAll } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface WebSocketNotification {
  id?: number;
  type: string;
  taller_id?: number;
  incidente_id?: number;
  titulo: string;
  descripcion: string;
  tipo: 'incidente_llegada' | 'incidente_aceptado' | 'incidente_rechazado' | 'tecnico_termino' | 'info';
  timestamp?: string;
  datos?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private ngZone = inject(NgZone);
  private socket$: WebSocketSubject<any> | null = null;
  private messagesSubject$ = new Subject<Observable<any>>();
  private messages$ = this.messagesSubject$.pipe(switchAll());
  private destroy$ = new Subject<void>();
  private currentTallerId: number | null = null;
  private reconnectAttempt = 0;
  private maxReconnectAttempts = 10;

  private _notifications = signal<WebSocketNotification[]>([]);
  private _isConnected = signal(false);
  private _newNotificationCount = signal(0);
  private _connectionError = signal<string | null>(null);

  notifications = this._notifications.asReadonly();
  isConnected = this._isConnected.asReadonly();
  newNotificationCount = this._newNotificationCount.asReadonly();
  connectionError = this._connectionError.asReadonly();

  private _notificationSubject = new BehaviorSubject<WebSocketNotification | null>(null);
  notification$: Observable<WebSocketNotification | null> = this._notificationSubject.asObservable();

  connect(tallerId: number): void {
    console.log(`[WebSocket] Initiating connection for taller_id: ${tallerId}`);
    this.currentTallerId = tallerId;
    this._connectionError.set(null);
    this.reconnectAttempt = 0;

    this.createSocket(tallerId);
  }

  private createSocket(tallerId: number): void {
    if (this.socket$) {
      try {
        this.socket$.complete();
      } catch (e) {
        console.log('[WebSocket] Previous socket already closed');
      }
      this.socket$ = null;
    }

    const baseWsUrl = environment.wsUrl || 'ws://localhost:8000/ws';
    const wsUrl = `${baseWsUrl}?taller_id=${tallerId}`;
    
    console.log(`[WebSocket] Creating socket to: ${wsUrl}`);

    this.socket$ = webSocket({
      url: wsUrl,
      openObserver: {
        next: () => {
          this.ngZone.run(() => {
            console.log('[WebSocket] Connection opened!');
            this._isConnected.set(true);
            this._connectionError.set(null);
            this.reconnectAttempt = 0;
            this.sendSubscribe(tallerId);
          });
        }
      },
      closeObserver: {
        next: (event) => {
          this.ngZone.run(() => {
            console.log('[WebSocket] Connection closed by server:', event);
            this._isConnected.set(false);
          });
        }
      }
    });

    const connection$ = this.socket$.pipe(
      tap({
        next: (msg) => console.log('[WebSocket] Message received:', msg),
        error: (err) => {
          console.error('[WebSocket] Socket error:', err);
          this.ngZone.run(() => {
            this._isConnected.set(false);
            this._connectionError.set('Error de conexión con el servidor');
            this.scheduleReconnect(tallerId);
          });
        },
        complete: () => {
          console.log('[WebSocket] Socket completed');
          this.ngZone.run(() => {
            this._isConnected.set(false);
          });
        }
      }),
      catchError((err) => {
        console.error('[WebSocket] Caught error:', err);
        return EMPTY;
      })
    );

    connection$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (message) => this.ngZone.run(() => this.handleMessage(message)),
      error: (err) => console.error('[WebSocket] Subscribe error:', err)
    });
  }

  private sendSubscribe(tallerId: number): void {
    if (this.socket$) {
      console.log(`[WebSocket] Sending subscribe message for taller_id: ${tallerId}`);
      this.socket$.next({
        type: 'subscribe',
        taller_id: tallerId
      });
    }
  }

  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    this.currentTallerId = null;
    
    if (this.socket$) {
      try {
        this.socket$.complete();
      } catch (e) {
        console.log('[WebSocket] Socket already completed');
      }
      this.socket$ = null;
    }
    
    this._isConnected.set(false);
    this._connectionError.set(null);
  }

  private handleMessage(message: any): void {
    console.log('[WebSocket] Processing message:', message);

    const notification: WebSocketNotification = {
      id: Date.now(),
      type: message.type || 'info',
      taller_id: message.taller_id,
      incidente_id: message.incidente_id,
      titulo: this.getTitulo(message),
      descripcion: this.getDescripcion(message),
      tipo: this.getTipo(message),
      timestamp: new Date().toISOString(),
      datos: message
    };

    this._notifications.update(notifications => [notification, ...notifications.slice(0, 49)]);
    this._newNotificationCount.update(count => count + 1);
    this._notificationSubject.next(notification);
  }

  private getTitulo(message: any): string {
    const titulos: Record<string, string> = {
      'nuevo_incidente': 'Nuevo Incidente Cercano',
      'incidente_asignado': 'Incidente Asignado',
      'incidente_aceptado': 'Incidente Aceptado',
      'incidente_rechazado': 'Incidente Rechazado',
      'tecnico_en_camino': 'Técnico en Camino',
      'tecnico_en_sitio': 'Técnico en Sitio',
      'incidente_finalizado': 'Incidente Finalizado',
      'subscribed': 'Conectado',
      'pong': 'Conexión Activa'
    };
    return titulos[message.type] || 'Notificación';
  }

  private getDescripcion(message: any): string {
    if (message.descripcion) return message.descripcion;

    switch (message.type) {
      case 'nuevo_incidente':
        return `Se detectó un incidente a ${message.distancia || 'N/A'} km de distancia`;
      case 'incidente_asignado':
        return `El incidente #${message.incidente_id} ha sido asignado a este taller`;
      case 'incidente_aceptado':
        return `Has aceptado el incidente #${message.incidente_id}`;
      case 'incidente_rechazado':
        return `Has rechazado el incidente #${message.incidente_id}`;
      case 'tecnico_en_camino':
        return `Técnico en camino al incidente #${message.incidente_id}`;
      case 'tecnico_en_sitio':
        return `Técnico llegó al sitio del incidente #${message.incidente_id}`;
      case 'incidente_finalizado':
        return `El incidente #${message.incidente_id} ha sido finalizado`;
      case 'subscribed':
        return 'Suscrito a notificaciones del taller';
      case 'pong':
        return 'La conexión está activa';
      default:
        return message.mensaje || 'Sin descripción';
    }
  }

  private getTipo(message: any): WebSocketNotification['tipo'] {
    const tipoMap: Record<string, WebSocketNotification['tipo']> = {
      'nuevo_incidente': 'incidente_llegada',
      'incidente_asignado': 'incidente_aceptado',
      'incidente_aceptado': 'incidente_aceptado',
      'incidente_rechazado': 'incidente_rechazado',
      'tecnico_termino': 'tecnico_termino',
      'tecnico_en_camino': 'info',
      'tecnico_en_sitio': 'info',
      'incidente_finalizado': 'info'
    };
    return tipoMap[message.type] || 'info';
  }

  private scheduleReconnect(tallerId: number): void {
    if (!this.currentTallerId || this.reconnectAttempt >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached or disconnected');
      this._connectionError.set('No se pudo conectar al servidor');
      return;
    }

    this.reconnectAttempt++;
    const delay = Math.min(this.reconnectAttempt * 2000, 10000);
    
    console.log(`[WebSocket] Scheduling reconnect attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.currentTallerId) {
        console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectAttempt})`);
        this.createSocket(tallerId);
      }
    }, delay);
  }

  markAsRead(): void {
    this._newNotificationCount.set(0);
  }

  clearNotifications(): void {
    this._notifications.set([]);
    this._newNotificationCount.set(0);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}