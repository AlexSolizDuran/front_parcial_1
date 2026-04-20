import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncidenteService } from '../../../services/incidente.service';
import { AuthService } from '../../../services/auth.service';
import { Incidente } from '../../../models/incidente.model';

@Component({
  selector: 'app-mis-incidentes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-surface dark:bg-[#191c1e]">
      <header
        class="bg-white dark:bg-[#2e3133] shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div class="flex justify-between items-center h-14 sm:h-16">
            <h1 class="text-base sm:text-xl font-bold text-on-surface dark:text-white">
              Mis Incidentes
            </h1>
            <button
              (click)="reportarEmergencia()"
              class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
            >
              + Reportar Emergencia
            </button>
          </div>
        </div>
      </header>

      @if (loading()) {
        <div class="flex items-center justify-center h-48 sm:h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      } @else if (incidentes().length === 0) {
        <div class="flex flex-col items-center justify-center h-64 px-4">
          <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-gray-500 text-center mb-4">No tienes incidentes reportados</p>
          <button
            (click)="reportarEmergencia()"
            class="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            Reportar mi primera emergencia
          </button>
        </div>
      } @else {
        <main class="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6 space-y-4">
          @for (incidente of incidentes(); track incidente.id) {
            <div 
              (click)="verDetalle(incidente.id)"
              class="bg-white dark:bg-[#2e3133] rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="text-sm font-medium text-on-surface dark:text-white">
                    Incidente #{{ incidente.id }}
                  </span>
                  <span class="ml-2 text-xs text-gray-500">
                    {{ formatoFecha(incidente.fecha_creacion) }}
                  </span>
                </div>
                <div class="flex gap-2">
                  <span [class]="getEstadoClass(incidente.estado)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ getEstadoLabel(incidente.estado) }}
                  </span>
                  @if (incidente.prioridad) {
                    <span [class]="getPrioridadClass(incidente.prioridad)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ getPrioridadLabel(incidente.prioridad) }}
                    </span>
                  }
                </div>
              </div>

              @if (incidente.especialidad_ia) {
                <div class="mb-2">
                  <span class="text-xs text-gray-500">Especialidad:</span>
                  <span class="text-sm text-on-surface dark:text-white ml-1">
                    {{ incidente.especialidad_ia }}
                  </span>
                </div>
              }

              @if (incidente.descripcion_ia) {
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {{ incidente.descripcion_ia }}
                </p>
              }

              <div class="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ incidente.ubicacion_lat.toFixed(4) }}, {{ incidente.ubicacion_lng.toFixed(4) }}</span>
              </div>
            </div>
          }
        </main>
      }
    </div>
  `,
})
export class MisIncidentes implements OnInit {
  incidenteService = inject(IncidenteService);
  authService = inject(AuthService);
  router = inject(Router);

  loading = signal(true);

  get incidentes() {
    return this.incidenteService.incidentes;
  }

  ngOnInit() {
    this.cargarIncidentes();
  }

  cargarIncidentes() {
    this.incidenteService.obtenerMisIncidentes().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  reportarEmergencia() {
    // This would navigate to a form to report an emergency
    // For now, we can use a simple alert to show this feature
    alert('Esta función te permitirá reportar una emergencia con GPS automático y captura de evidencias. Se implementará en la app móvil.');
  }

  verDetalle(id: number) {
    this.router.navigate(['/cliente/incidentes', id]);
  }

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'reportado': 'bg-yellow-100 text-yellow-800',
      'asignado': 'bg-blue-100 text-blue-800',
      'en_camino': 'bg-purple-100 text-purple-800',
      'en_sitio': 'bg-orange-100 text-orange-800',
      'finalizado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return classes[estado] || 'bg-gray-100 text-gray-800';
  }

  getEstadoLabel(estado: string): string {
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

  getPrioridadClass(prioridad?: string): string {
    if (!prioridad) return '';
    const classes: Record<string, string> = {
      'baja': 'bg-green-100 text-green-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'urgente': 'bg-red-100 text-red-800'
    };
    return classes[prioridad] || '';
  }

  getPrioridadLabel(prioridad?: string): string {
    if (!prioridad) return '';
    const labels: Record<string, string> = {
      'baja': 'Baja',
      'media': 'Media',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[prioridad] || '';
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}