import { Component, signal, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { IncidenteService } from '../../../services/incidente.service';
import { TecnicoService } from '../../../services/tecnico.service';
import { WebSocketService, WebSocketNotification } from '../../../services/websocket.service';
import { NotificacionService, Notificacion } from '../../../services/notificacion.service';
import { IncidenteTallerService, AsignacionPendiente } from '../../../services/incidente-taller.service';
import { ModalCrearTaller } from '../../../components/modal-crear-taller/modal-crear-taller';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { DetalleIncidenteModalComponent } from '../../../components/detalle-incidente-modal/detalle-incidente-modal';
import { IncidentePendienteCardComponent } from '../../../components/incidente-pendiente-card/incidente-pendiente-card';
import { DetalleIncidenteFullComponent } from '../../../components/detalle-incidente-full/detalle-incidente-full';
import { Incidente } from '../../../models/incidente.model';
import { Tecnico } from '../../../models/tecnico.model';
import { HistorialTaller } from '../../../models/historial-taller.model';
import { IncidenteAsignado, IncidentesDelDia } from '../../../models/incidente-asignado.model';

import * as L from 'leaflet';

interface Estadisticas {
  total_solicitudes: number;
  solicitudes_pendientes: number;
  solicitudes_completadas: number;
  tecnicos_activos: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ModalCrearTaller, Sidebar, DetalleIncidenteModalComponent, IncidentePendienteCardComponent, DetalleIncidenteFullComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  authService = inject(AuthService);
  tallerService = inject(TallerService);
  sidebarService = inject(SidebarService);
  incidenteService = inject(IncidenteService);
  tecnicoService = inject(TecnicoService);
  wsService = inject(WebSocketService);
  notificacionService = inject(NotificacionService);
  incidenteTallerService = inject(IncidenteTallerService);

  user = this.authService.user;
  taller = this.tallerService.taller;
  showModal = this.tallerService.showModal;
  collapsed = this.sidebarService.collapsed;

  estadisticas = signal<Estadisticas>({
    total_solicitudes: 0,
    solicitudes_pendientes: 0,
    solicitudes_completadas: 0,
    tecnicos_activos: 0,
  });

  notificacionesBD = this.notificacionService.notificaciones;
  incidentesDashboard = signal<Incidente[]>([]);
  tecnicosDashboard = signal<Tecnico[]>([]);
  historialTaller = signal<HistorialTaller[]>([]);
  wsNotifications = this.wsService.notifications;
  isWsConnected = this.wsService.isConnected;
  newNotificationCount = this.wsService.newNotificationCount;

incidentesDelDia = signal<IncidentesDelDia>({
    total_hoy: 0,
    activos: 0,
    finalizados: 0,
    incidentes: []
  });
  incidenteSeleccionado = signal<IncidenteAsignado | null>(null);
  showDetalleModal = signal(false);

  asignacionPendiente = signal<AsignacionPendiente | null>(null);
  showDetallePendienteModal = signal(false);

  loading = signal(true);
  showNotificationPanel = signal(false);

  private map: L.Map | undefined;
  private markerIncidentes: L.Marker[] = [];
  private markerTecnicos: L.Marker[] = [];
  private tecnicosTimer: any;
  private mapaListo = false;

   ngOnInit() {
    // Cargar taller y luego todos los datos
    this.tallerService.checkMiTaller().subscribe({
      next: (taller) => {
        console.log('[DEBUG] Dashboard - Taller cargado:', taller);
        this.loading.set(false);
        
        if (taller?.id) {
          // Conectar WebSocket inmediatamente
          this.wsService.connect(taller.id);
          
          // Cargar TODOS los datos del dashboard después de confirmar taller
          // Pasamos el taller directamente para evitar problemas de timing
          this.cargarDatos(taller);
          this.cargarAsignacionPendiente();
          this.cargarTecnicos();
        }
        
        // Iniciar mapa después de un breve delay
        setTimeout(() => {
          this.iniciarMapa();
        }, 100);
      },
      error: (err) => {
        console.error('[DEBUG] Dashboard - Error taller:', err);
        this.loading.set(false);
      }
    });

    // Timer para recargar técnicos cada 30 segundos
    this.tecnicosTimer = setInterval(() => {
      this.cargarTecnicos();
    }, 30000);

    // Suscribirse al WebSocket para recibir notificaciones en tiempo real
    this.wsService.notification$.subscribe(notification => {
      if (notification) {
        this.cargarHistorialTaller();
        if (notification.type === 'nuevo_incidente' || 
            notification.type === 'incidente_asignado' || 
            notification.type === 'incidente_aceptado' ||
            notification.type === 'tecnico_en_camino' ||
            notification.type === 'tecnico_en_sitio' ||
            notification.type === 'tecnico_termino') {
          this.cargarAsignacionPendiente();
          this.cargarDatos();
        }
      }
    });
  }

  ngOnDestroy() {
    this.wsService.disconnect();
    if (this.tecnicosTimer) {
      clearInterval(this.tecnicosTimer);
    }
    this.mapaListo = false;
  }

  private cargarAsignacionPendiente() {
    const taller = this.tallerService.taller();
    if (!taller?.id) return;

    this.incidenteTallerService.obtenerAsignacionPendiente(taller.id).subscribe({
      next: (asignacion) => {
        this.asignacionPendiente.set(asignacion);
      },
      error: () => {}
    });
  }

  onAceptarIncidente(asignacionId: number) {
    this.incidenteTallerService.aceptarAsignacion(asignacionId).subscribe({
      next: () => {
        this.asignacionPendiente.set(null);
        this.showDetallePendienteModal.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al aceptar:', err);
      }
    });
  }

  onRechazarIncidente(asignacionId: number) {
    this.incidenteTallerService.rechazarAsignacion(asignacionId).subscribe({
      next: () => {
        this.asignacionPendiente.set(null);
        this.showDetallePendienteModal.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al rechazar:', err);
      }
    });
  }

  onIncidenteExpirado() {
    const asignacion = this.asignacionPendiente();
    if (asignacion) {
      this.onRechazarIncidente(asignacion.asignacion.id);
    }
  }

  onVerDetallesPendiente() {
    this.showDetallePendienteModal.set(true);
  }

  onCerrarDetallePendiente() {
    this.showDetallePendienteModal.set(false);
  }

  reloadData() {
    this.cargarDatos();
    this.cargarAsignacionPendiente();
    this.cargarTecnicos();
  }

  private cargarTecnicos() {
    this.tecnicoService.getTecnicos().subscribe({
      next: (tecnicos) => {
        console.log('Técnicos cargados desde timer:', tecnicos);
        this.tecnicosDashboard.set(tecnicos);
        this.actualizarMarcadoresTecnicos();
      },
      error: (err) => {
        console.error('Error al cargar técnicos:', err);
      },
    });
  }

  private actualizarMarcadoresTecnicos() {
    if (!this.map) return;

    this.markerTecnicos.forEach((m) => m.remove());
    this.markerTecnicos = [];

    this.tecnicosDashboard().forEach((tec) => {
      if (tec.disponible && tec.ubicacion_lat && tec.ubicacion_lng) {
        const iconTecnico = L.divIcon({
          html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">🔧</div>',
          className: 'custom-icon-tecnico',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const marker = L.marker([tec.ubicacion_lat, tec.ubicacion_lng], { icon: iconTecnico })
          .bindPopup(`<b>🔧 ${tec.usuario?.nombre || 'Técnico'}</b><br>Disponible ✅`)
          .addTo(this.map!);
        this.markerTecnicos.push(marker);
      }
    });
  }

  recargarMapa() {
    this.cargarTecnicos();
    this.cargarIncidentesAsignados();
    this.recargarMarcadores();
  }

  private cargarIncidentesAsignados() {
    const taller = this.tallerService.taller();
    if (!taller?.id) return;

    this.incidenteTallerService.obtenerIncidentesAsignados(taller.id).subscribe({
      next: (resp) => {
        if (resp && typeof resp === 'object' && 'incidentes' in resp) {
          const data = resp as any;
          this.incidentesDelDia.set({
            total_hoy: data.total_hoy || 0,
            activos: data.activos || 0,
            finalizados: data.finalizados || 0,
            incidentes: data.incidentes || []
          });
        }
      },
      error: () => {}
    });
  }

  private recargarMarcadores() {
    if (!this.map) {
      this.iniciarMapa();
      return;
    }

    this.markerIncidentes.forEach((m) => m.remove());
    this.markerIncidentes = [];
    this.markerTecnicos.forEach((m) => m.remove());
    this.markerTecnicos = [];

    const taller = this.tallerService.taller();
    if (taller?.ubicacion_lat && taller?.ubicacion_lng) {
      this.map.setView([taller.ubicacion_lat, taller.ubicacion_lng], this.map.getZoom());
    }

    this.incidentesDashboard().forEach((inc) => {
      if (inc.ubicacion_lat && inc.ubicacion_lng) {
        const icono = this.getIconoIncidente(inc.estado);
        const color = this.getColorIncidente(inc.estado);
        const estadoLabel = this.getEstadoLabel(inc.estado);
        
        const iconIncidente = L.divIcon({
          html: `<div style="font-size: 22px; line-height: 22px; text-align: center;">${icono}</div>`,
          className: 'custom-icon-incidente',
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26],
        });

        const marker = L.marker([inc.ubicacion_lat, inc.ubicacion_lng], { icon: iconIncidente })
          .bindPopup(`
            <b>🚨 Incidente #${inc.id}</b><br>
            <span style="color: ${color};">● ${estadoLabel}</span><br>
            ${inc.especialidad_ia || 'General'}<br>
            ${inc.descripcion_ia || inc.descripcion_original || ''}
          `)
          .addTo(this.map!);
        this.markerIncidentes.push(marker);
      }
    });

    this.tecnicosDashboard().forEach((tec) => {
      if (tec.disponible && tec.ubicacion_lat && tec.ubicacion_lng) {
        const iconTecnico = L.divIcon({
          html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">🔧</div>',
          className: 'custom-icon-tecnico',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const marker = L.marker([tec.ubicacion_lat, tec.ubicacion_lng], { icon: iconTecnico })
          .bindPopup(`<b>🔧 ${tec.usuario?.nombre || 'Técnico'}</b><br>Disponible ✅`)
          .addTo(this.map!);
        this.markerTecnicos.push(marker);
      }
    });
  }

    private cargarDatos(tallerParam?: any) {
      // Usar el parámetro si se proporciona, sino leer del signal
      const taller = tallerParam || this.tallerService.taller();
      
      this.notificacionService.obtenerMisNotificaciones().subscribe();

      if (taller?.id) {
        this.incidenteTallerService.obtenerEstadisticas(taller.id).subscribe({
          next: (stats) => {
            this.estadisticas.set({
              total_solicitudes: stats.total,
              solicitudes_pendientes: stats.pendientes,
              solicitudes_completadas: stats.completadas,
              tecnicos_activos: this.estadisticas().tecnicos_activos,
            });
          },
          error: () => {}
        });

        this.incidenteService.obtenerIncidentesTaller(taller.id).subscribe({
          next: (incidentesTaller) => {
            this.incidentesDashboard.set(incidentesTaller);
            this.actualizarMarcadores();
          },
          error: () => {}
        });

        this.incidenteTallerService.obtenerIncidentesAsignados(taller.id).subscribe({
          next: (resp) => {
            if (resp && typeof resp === 'object' && 'incidentes' in resp) {
              const data = resp as any;
              this.incidentesDelDia.set({
                total_hoy: data.total_hoy || 0,
                activos: data.activos || 0,
                finalizados: data.finalizados || 0,
                incidentes: data.incidentes || []
              });
            }
          },
          error: () => {}
        });

        this.tecnicoService.getTecnicos().subscribe({
          next: (tecnicos) => {
            this.tecnicosDashboard.set(tecnicos);
            this.estadisticas.update((e) => ({
              ...e,
              tecnicos_activos: tecnicos.filter((t) => t.disponible).length,
            }));
            this.actualizarMarcadores();
          },
          error: () => {},
        });
      }

      this.wsService.notification$.subscribe(() => {
        this.cargarHistorialTaller();
      });
    }

  private cargarHistorialTaller() {
    const taller = this.tallerService.taller();
    if (taller?.id) {
      this.tallerService.obtenerHistorialTaller(taller.id).subscribe({
        next: (historial) => {
          this.historialTaller.set(historial);
        },
        error: () => {}
      });
    }
  }

  conectarWebSocket() {
    const taller = this.tallerService.taller();
    if (taller?.id) {
      this.wsService.connect(taller.id);
      this.cargarHistorialTaller();
    }
  }

  desconectarWebSocket() {
    this.wsService.disconnect();
  }

  toggleNotificationPanel() {
    this.showNotificationPanel.update(v => !v);
    if (this.showNotificationPanel()) {
      this.wsService.markAsRead();
      this.cargarHistorialTaller();
    }
  }

  getNotificacionIcon(tipo: string): string {
    const iconos: Record<string, string> = {
      'incidente_llegada': '🔔',
      'incidente_aceptado': '✅',
      'incidente_rechazado': '❌',
      'tecnico_termino': '🔧',
      'info': 'ℹ️'
    };
    return iconos[tipo] || '📢';
  }

  getNotificacionColor(tipo: string): string {
    const colores: Record<string, string> = {
      'incidente_llegada': 'bg-blue-100 text-blue-800 border-blue-200',
      'incidente_aceptado': 'bg-green-100 text-green-800 border-green-200',
      'incidente_rechazado': 'bg-red-100 text-red-800 border-red-200',
      'tecnico_termino': 'bg-purple-100 text-purple-800 border-purple-200',
      'info': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getNotificacionLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'incidente_llegada': 'Nuevo',
      'incidente_aceptado': 'Asignado',
      'incidente_rechazado': 'Rechazado',
      'tecnico_termino': 'Completado',
      'info': 'Info'
    };
    return labels[tipo] || 'Notificación';
  }

  private iniciarMapa() {
    const taller = this.tallerService.taller();
    const lat = taller?.ubicacion_lat || -17.7833;
    const lng = taller?.ubicacion_lng || -63.1821;

    this.map = L.map('mapa-dashboard').setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    if (taller?.ubicacion_lat && taller?.ubicacion_lng) {
      const iconCasa = L.divIcon({
        html: '<div style="font-size: 28px; line-height: 28px; text-align: center;">🏠</div>',
        className: 'custom-icon-taller',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      L.marker([lat, lng], { icon: iconCasa })
        .bindPopup(`<b>${taller.nombre}</b><br>Taller`)
        .addTo(this.map);
    }

    if (taller?.id) {
      this.conectarWebSocket();
    }

    this.mapaListo = true;

    if (this.incidentesDashboard().length > 0 || this.tecnicosDashboard().length > 0) {
      setTimeout(() => this.actualizarMarcadores(), 0);
    }
  }

  private actualizarMarcadores() {
    if (!this.map) {
      if (this.mapaListo) {
        setTimeout(() => this.actualizarMarcadores(), 100);
      }
      return;
    }

    this.markerIncidentes.forEach(m => m.remove());
    this.markerTecnicos.forEach(m => m.remove());
    this.markerIncidentes = [];
    this.markerTecnicos = [];

    this.incidentesDashboard().forEach((inc) => {
      if (inc.ubicacion_lat && inc.ubicacion_lng) {
        const color = this.getColorIncidente(inc.estado);
        const icono = this.getIconoIncidente(inc.estado);
        
        const iconIncidente = L.divIcon({
          html: `<div style="font-size: 22px; line-height: 22px; text-align: center;">${icono}</div>`,
          className: 'custom-icon-incidente',
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26],
        });

        const estadoLabel = this.getEstadoLabel(inc.estado);
        const marker = L.marker([inc.ubicacion_lat, inc.ubicacion_lng], { icon: iconIncidente })
          .bindPopup(`
            <b>🚨 Incidente #${inc.id}</b><br>
            <span style="color: ${color};">● ${estadoLabel}</span><br>
            ${inc.especialidad_ia || 'General'}<br>
            ${inc.descripcion_ia || inc.descripcion_original || ''}
          `)
          .addTo(this.map!);
        this.markerIncidentes.push(marker);
      }
    });

    const taller = this.tallerService.taller();
    console.log('Técnicos cargados:', this.tecnicosDashboard());
    this.tecnicosDashboard().forEach((tec) => {
      console.log(`Técnico ${tec.id}: disponible=${tec.disponible}, lat=${tec.ubicacion_lat}, lng=${tec.ubicacion_lng}`);
      if (tec.disponible && tec.ubicacion_lat && tec.ubicacion_lng) {
        const iconTecnico = L.divIcon({
          html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">🔧</div>',
          className: 'custom-icon-tecnico',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const marker = L.marker([tec.ubicacion_lat, tec.ubicacion_lng], { icon: iconTecnico })
          .bindPopup(`<b>🔧 ${tec.usuario?.nombre || 'Técnico'}</b><br>Disponible ✅`)
          .addTo(this.map!);
        this.markerTecnicos.push(marker);
      }
    });
  }

  getColorIncidente(estado: string): string {
    switch (estado) {
      case 'reportado': return '#F59E0B';
      case 'asignado': return '#3B82F6';
      case 'en_camino': return '#F97316';
      case 'en_sitio': return '#22C55E';
      case 'finalizado': return '#6B7280';
      case 'cancelado': return '#EF4444';
      default: return '#6B7280';
    }
  }

  getIconoIncidente(estado: string): string {
    switch (estado) {
      case 'reportado': return '🟡';
      case 'asignado': return '🔵';
      case 'en_camino': return '🟠';
      case 'en_sitio': return '🟢';
      case 'finalizado': return '⚪';
      case 'cancelado': return '🔴';
      default: return '⚪';
    }
  }

  private mapEstadoIncidente(
    estado: string
  ): 'pendiente' | 'en_proceso' | 'completado' {
    switch (estado) {
      case 'reportado':
      case 'asignado':
        return 'pendiente';
      case 'en_camino':
      case 'en_sitio':
        return 'en_proceso';
      case 'finalizado':
      case 'cancelado':
        return 'completado';
      default:
        return 'pendiente';
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'completado':
        return 'Completado';
      default:
        return estado;
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  abrirDetalleIncidente(incidente: IncidenteAsignado) {
    this.incidenteSeleccionado.set(incidente);
    this.showDetalleModal.set(true);
  }

  cerrarDetalleIncidente() {
    this.showDetalleModal.set(false);
    this.incidenteSeleccionado.set(null);
  }

  onEstadoCambiado(incidenteId: number) {
    const taller = this.tallerService.taller();
    if (taller?.id) {
      this.incidenteTallerService.obtenerIncidentesAsignados(taller.id).subscribe({
        next: (resp) => {
          if (resp && typeof resp === 'object' && 'incidentes' in resp) {
            const data = resp as any;
            this.incidentesDelDia.set({
              total_hoy: data.total_hoy || 0,
              activos: data.activos || 0,
              finalizados: data.finalizados || 0,
              incidentes: data.incidentes || []
            });
          }
        },
        error: () => {}
      });
    }
  }

  getBadgeIncidentesHoy(): string {
    const data = this.incidentesDelDia();
    return `${data.total_hoy} (${data.activos} activos, ${data.finalizados} finalizados)`;
  }

  getPrioridadColor(prioridad: string | null | undefined): string {
    if (!prioridad) return 'bg-gray-100 text-gray-800';
    switch (prioridad.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEstadoIncidenteColor(estado: string): string {
    switch (estado) {
      case 'asignado':
        return 'bg-blue-100 text-blue-800';
      case 'en_camino':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_sitio':
        return 'bg-orange-100 text-orange-800';
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getLabelEstado(estado: string): string {
    switch (estado) {
      case 'asignado':
        return 'Asignado';
      case 'en_camino':
        return 'En Camino';
      case 'en_sitio':
        return 'En Sitio';
      case 'finalizado':
        return 'Finalizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }
}
