import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TallerService } from '../../../services/taller.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { SidebarService } from '../../../services/sidebar.service';

interface Evidencia {
  id: number;
  tipo: string;
  url_archivo: string | null;
  contenido: string | null;
  transcripcion: string | null;
  descripcion: string | null;
  fecha_subida: string | null;
}

interface Cliente {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
}

interface IncidenteCercano {
  id: number;
  estado: string;
  especialidad_ia: string | null;
  descripcion: string | null;
  descripcion_ia: string | null;
  prioridad: string | null;
  ubicacion_lat: number;
  ubicacion_lng: number;
  distancia_km: number;
  fecha_creacion: string | null;
  cliente: Cliente | null;
  total_evidencias: number;
  evidencias: Evidencia[];
}

interface DetalleCompleto {
  incidente: {
    id: number;
    estado: string;
    especialidad_ia: string | null;
    descripcion_ia: string | null;
    descripcion: string | null;
    descripcion_original: string | null;
    prioridad: string | null;
    requiere_mas_evidencia: number;
    mensaje_solicitud: string | null;
    ubicacion_lat: number;
    ubicacion_lng: number;
    fecha_creacion: string | null;
  };
  cliente: Cliente | null;
  vehiculo: {
    id: number;
    marca: string | null;
    modelo: string | null;
    patente: string | null;
    anio: number | null;
  } | null;
  evidencias: Evidencia[];
  historial: {
    id: number;
    titulo: string;
    descripcion: string | null;
    fecha_hora: string | null;
  }[];
}

@Component({
  selector: 'app-incidentes-cercanos',
  standalone: true,
  imports: [CommonModule, Sidebar],
  templateUrl: './incidentes-cercanos.html',
  styleUrl: './incidentes-cercanos.css',
})
export class IncidentesCercanos implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private tallerService = inject(TallerService);
  private sidebarService = inject(SidebarService);
  authService = inject(AuthService);

  taller = this.tallerService.taller;
  collapsed = this.sidebarService.collapsed;

  incidentes = signal<IncidenteCercano[]>([]);
  incidenteSeleccionado = signal<DetalleCompleto | null>(null);
  loading = signal(true);
  loadingDetalle = signal(false);
  showModal = signal(false);

  ngOnInit() {
    this.tallerService.checkMiTaller().subscribe(() => {
      this.cargarIncidentesCercanos();
    });
  }

  ngOnDestroy() {}

  get apiUrl() {
    return environment.apiUrl;
  }

  cargarIncidentesCercanos() {
    const taller = this.tallerService.taller();
    if (!taller?.id) return;

    const token = localStorage.getItem('token');
    this.loading.set(true);

    this.http.get<IncidenteCercano[]>(
      `${this.apiUrl}/incidentes/cercanos/${taller.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (data) => {
        this.incidentes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  verDetalle(incidenteId: number) {
    const token = localStorage.getItem('token');
    this.loadingDetalle.set(true);
    this.showModal.set(true);

    this.http.get<DetalleCompleto>(
      `${this.apiUrl}/incidentes/${incidenteId}/detalle-completo`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (data) => {
        this.incidenteSeleccionado.set(data);
        this.loadingDetalle.set(false);
      },
      error: () => {
        this.loadingDetalle.set(false);
        this.showModal.set(false);
      }
    });
  }

  cerrarModal() {
    this.showModal.set(false);
    this.incidenteSeleccionado.set(null);
  }

  aceptarIncidente(incidenteId: number) {
    const taller = this.tallerService.taller();
    if (!taller?.id) return;

    const token = localStorage.getItem('token');
    this.http.post(
      `${this.apiUrl}/incidentes/${incidenteId}/asignar`,
      { taller_id: taller.id },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarIncidentesCercanos();
      },
      error: (err) => {
        console.error('Error al aceptar incidente:', err);
      }
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'reportado': return 'bg-yellow-100 text-yellow-800';
      case 'asignado': return 'bg-blue-100 text-blue-800';
      case 'en_camino': return 'bg-orange-100 text-orange-800';
      case 'en_sitio': return 'bg-green-100 text-green-800';
      case 'finalizado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPrioridadColor(prioridad: string | null): string {
    switch (prioridad) {
      case 'urgente': return 'bg-red-100 text-red-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
}