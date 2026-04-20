import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidenteService } from '../../../services/incidente.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { IncidenteCompleto, Evidencia } from '../../../models/incidente.model';

@Component({
  selector: 'app-detalle-incidente',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="min-h-screen bg-surface dark:bg-[#191c1e] flex">
      <app-sidebar></app-sidebar>

      <div
        [class]="collapsed() ? 'lg:ml-16' : 'lg:ml-64'"
        class="flex-1 pt-14 lg:pt-0 lg:transition-all lg:duration-300"
      >
        <header
          class="bg-white dark:bg-[#2e3133] shadow-sm border-b border-gray-200 dark:border-gray-700"
        >
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div class="flex justify-between items-center h-14 sm:h-16">
              <div class="flex items-center gap-3">
                <button
                  (click)="volver()"
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 class="text-base sm:text-xl font-bold text-on-surface dark:text-white">
                  Detalle del Incidente #{{ incidenteId }}
                </h1>
              </div>
            </div>
          </div>
        </header>

        @if (loading()) {
          <div class="flex items-center justify-center h-48 sm:h-64">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        } @else if (incidente()) {
          <main class="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6 space-y-4">
            <!-- Estado y Prioridad -->
            <div class="bg-white dark:bg-[#2e3133] rounded-lg shadow-sm p-4 sm:p-6">
              <div class="flex flex-wrap gap-3 mb-4">
                <span
                  [class]="getEstadoClass(incidente()!.incidente.estado)"
                  class="px-3 py-1 rounded-full text-sm font-medium"
                >
                  {{ getEstadoLabel(incidente()!.incidente.estado) }}
                </span>
                @if (incidente()!.incidente.prioridad) {
                  <span
                    [class]="getPrioridadClass(incidente()!.incidente.prioridad)"
                    class="px-3 py-1 rounded-full text-sm font-medium"
                  >
                    Prioridad: {{ getPrioridadLabel(incidente()!.incidente.prioridad) }}
                  </span>
                }
              </div>
              
              @if (incidente()!.incidente.especialidad_ia) {
                <div class="mb-3">
                  <h3 class="text-sm font-medium text-gray-500">Especialidad (IA)</h3>
                  <p class="text-on-surface dark:text-white">
                    {{ incidente()!.incidente.especialidad_ia }}
                  </p>
                </div>
              }

              @if (incidente()!.incidente.descripcion_ia) {
                <div class="mb-3">
                  <h3 class="text-sm font-medium text-gray-500">Descripción del Análisis IA</h3>
                  <p class="text-on-surface dark:text-white text-sm">
                    {{ incidente()!.incidente.descripcion_ia }}
                  </p>
                </div>
              }

              <div class="text-sm text-gray-500">
                <p>Fecha de creación: {{ formatoFecha(incidente()!.incidente.fecha_creacion) }}</p>
                <p>Última actualización: {{ formatoFecha(incidente()!.incidente.fecha_actualizacion) }}</p>
              </div>
            </div>

            <!-- Ubicación -->
            <div class="bg-white dark:bg-[#2e3133] rounded-lg shadow-sm p-4 sm:p-6">
              <h3 class="text-lg font-semibold text-on-surface dark:text-white mb-3">
                Ubicación
              </h3>
              <div class="flex gap-4 text-sm">
                <div class="flex-1">
                  <p class="text-gray-500">Latitud</p>
                  <p class="text-on-surface dark:text-white">{{ incidente()!.incidente.ubicacion_lat.toFixed(6) }}</p>
                </div>
                <div class="flex-1">
                  <p class="text-gray-500">Longitud</p>
                  <p class="text-on-surface dark:text-white">{{ incidente()!.incidente.ubicacion_lng.toFixed(6) }}</p>
                </div>
              </div>
              <a
                [href]="'https://www.openstreetmap.org/?mlat=' + incidente()!.incidente.ubicacion_lat + '&mlon=' + incidente()!.incidente.ubicacion_lng + '#map=15/' + incidente()!.incidente.ubicacion_lat + '/' + incidente()!.incidente.ubicacion_lng"
                target="_blank"
                class="inline-block mt-3 text-blue-600 hover:underline text-sm"
              >
                Ver en mapa ↗
              </a>
            </div>

            <!-- Evidencias -->
            @if (incidente()!.evidencias.length > 0) {
              <div class="bg-white dark:bg-[#2e3133] rounded-lg shadow-sm p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-on-surface dark:text-white mb-3">
                  Evidencias ({{ incidente()!.evidencias.length }})
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  @for (evidencia of incidente()!.evidencias; track evidencia.id) {
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      @if (evidencia.tipo === 'foto') {
                        <div class="mb-2">
                          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Foto</span>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-800 rounded h-32 flex items-center justify-center">
                          <span class="text-gray-500 text-sm">Imagen: {{ evidencia.url_archivo }}</span>
                        </div>
                      } @else {
                        <div class="mb-2">
                          <span class="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Audio</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <svg class="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                          </svg>
                          <span class="text-sm text-gray-500">Audio</span>
                        </div>
                      }
                      
                      @if (evidencia.transcripcion) {
                        <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 mb-1">Transcripción:</p>
                          <p class="text-xs text-on-surface dark:text-white">{{ evidencia.transcripcion }}</p>
                        </div>
                      }
                      
                      <p class="text-xs text-gray-500 mt-2">
                        Subido: {{ formatoFecha(evidencia.fecha_subida) }}
                      </p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Historia del Incidente -->
            @if (incidente()!.historial.length > 0) {
              <div class="bg-white dark:bg-[#2e3133] rounded-lg shadow-sm p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-on-surface dark:text-white mb-3">
                  Historia del Incidente
                </h3>
                <div class="space-y-4">
                  @for (histo of incidente()!.historial; track histo.id) {
                    <div class="border-l-2 border-blue-500 pl-4">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-medium px-2 py-0.5 rounded" 
                              [class]="getEstadoClase(histo.estado)">
                          {{ histo.estado }}
                        </span>
                        <span class="text-xs text-gray-500">
                          {{ formatoFecha(histo.fecha_hora) }}
                        </span>
                      </div>
                      <p class="font-medium text-on-surface dark:text-white">
                        {{ histo.titulo }}
                      </p>
                      @if (histo.descripcion) {
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {{ histo.descripcion }}
                        </p>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Acciones -->
            <div class="flex gap-3">
              <button
                (click)="volver()"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Volver
              </button>
              @if (incidente()!.incidente.estado === 'asignado') {
                <button
                  (click)="aceptarIncidente()"
                  class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Aceptar Incidente
                </button>
              }
            </div>
          </main>
        } @else {
          <div class="flex items-center justify-center h-48 sm:h-64">
            <p class="text-gray-500">Incidente no encontrado</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class DetalleIncidente implements OnInit {
  incidenteService = inject(IncidenteService);
  tallerService = inject(TallerService);
  sidebarService = inject(SidebarService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  loading = signal(true);
  incidenteId: number = 0;
  
  get incidente() {
    return this.incidenteService.incidenteActual;
  }

  get collapsed() {
    return this.sidebarService.collapsed;
  }

  ngOnInit() {
    this.incidenteId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.incidenteId) {
      this.cargarIncidente();
    } else {
      this.loading.set(false);
    }
  }

  cargarIncidente() {
    this.incidenteService.obtenerEstadisticas(this.incidenteId).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/taller/incidentes']);
  }

  aceptarIncidente() {
    // In a real implementation, this would call the API to accept the incident
    console.log('Aceptar incidente:', this.incidenteId);
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

  getEstadoClase(estado: string): string {
    const classes: Record<string, string> = {
      'recibido': 'bg-blue-100 text-blue-800',
      'en_revision': 'bg-yellow-100 text-yellow-800',
      'asignado': 'bg-purple-100 text-purple-800',
      'en_atencion': 'bg-orange-100 text-orange-800',
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return classes[estado] || 'bg-gray-100 text-gray-800';
  }

  getPrioridadClass(prioridad?: string): string {
    if (!prioridad) return 'bg-gray-100 text-gray-800';
    
    const classes: Record<string, string> = {
      'baja': 'bg-green-100 text-green-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'urgente': 'bg-red-100 text-red-800'
    };
    return classes[prioridad] || 'bg-gray-100 text-gray-800';
  }

  getPrioridadLabel(prioridad?: string): string {
    if (!prioridad) return 'Sin prioridad';
    const labels: Record<string, string> = {
      'baja': 'Baja',
      'media': 'Media',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[prioridad] || prioridad;
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}