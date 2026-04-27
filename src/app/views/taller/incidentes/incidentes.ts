import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncidenteService } from '../../../services/incidente.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { Incidente, IncidenteCompleto } from '../../../models/incidente.model';

@Component({
  selector: 'app-incidentes',
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
              <h1 class="text-base sm:text-xl font-bold text-on-surface dark:text-white">
                Incidentes
              </h1>
            </div>
          </div>
        </header>

        @if (isLoading) {
          <div class="flex items-center justify-center h-48 sm:h-64">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        } @else if (!taller) {
          <div class="flex items-center justify-center h-48 sm:h-64">
            <p class="text-gray-500">Debes crear un taller primero</p>
          </div>
        } @else {
          <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6">
            <div class="bg-white dark:bg-[#2e3133] rounded-lg shadow-sm overflow-hidden">
              <div
                class="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-col sm:flex-row gap-2 sm:gap-3"
              >
                <h2 class="text-base sm:text-lg font-semibold text-on-surface dark:text-white">
                  Incidentes Asignados
                </h2>
                <div class="flex gap-2">
                  <select
                    (change)="filtrarPorEstado($event)"
                    class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#191c1e] text-on-surface dark:text-white"
                  >
                    <option value="">Todos los estados</option>
                    <option value="reportado">Reportado</option>
                    <option value="asignado">Asignado</option>
                    <option value="en_camino">En camino</option>
                    <option value="en_sitio">En sitio</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              @if (incidentesFiltrados().length === 0) {
                <div class="px-3 sm:px-4 py-8 text-center text-gray-500">
                  No hay incidentes asignados a tu taller
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[600px]">
                    <thead class="bg-gray-50 dark:bg-[#191c1e]">
                      <tr>
                        <th class="px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          ID
                        </th>
                        <th class="px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                        <th class="px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Prioridad
                        </th>
                        <th class="px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Categoría IA
                        </th>
                        <th class="px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th class="px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                      @for (incidente of incidentesFiltrados(); track incidente.id) {
                        <tr class="hover:bg-gray-50 dark:hover:bg-[#191c1e]">
                          <td class="px-3 py-3 text-xs sm:text-sm text-on-surface dark:text-white">
                            #{{ incidente.id }}
                          </td>
                          <td class="px-3 py-3">
                            <span
                              [class]="getEstadoClass(incidente.estado)"
                              class="px-2 py-0.5 rounded-full text-xs font-medium"
                            >
                              {{ getEstadoLabel(incidente.estado) }}
                            </span>
                          </td>
                          <td class="px-3 py-3">
                            <span
                              [class]="getPrioridadClass(incidente.prioridad)"
                              class="px-2 py-0.5 rounded-full text-xs font-medium"
                            >
                              {{ getPrioridadLabel(incidente.prioridad) }}
                            </span>
                          </td>
                          <td class="px-3 py-3 text-xs sm:text-sm text-on-surface dark:text-white">
                            {{ incidente.especialidad_ia || 'Sin análisis' }}
                          </td>
                          <td class="px-3 py-3 text-xs sm:text-sm text-gray-500">
                            {{ formatoFecha(incidente.fecha_creacion) }}
                          </td>
                          <td class="px-3 py-3">
                            <button
                              (click)="verDetalle(incidente.id)"
                              class="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </main>
        }
      </div>
    </div>
  `,
})
export class Incidentes implements OnInit {
  incidenteService = inject(IncidenteService);
  tallerService = inject(TallerService);
  sidebarService = inject(SidebarService);
  router = inject(Router);

  filtroEstado = signal('');

  get collapsed() {
    return this.sidebarService.collapsed;
  }

  get taller() {
    return this.tallerService.taller;
  }

  get isLoading(): boolean {
    return this._loading();
  }

  incidentesFiltrados = signal<Incidente[]>([]);
  private _loading = signal(true);

  ngOnInit() {
    this.tallerService.checkMiTaller().subscribe({
      next: (taller) => {
        if (taller) {
          this.cargarIncidentesPorTaller(taller.id);
        } else {
          this._loading.set(false);
        }
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  cargarIncidentesPorTaller(tallerId: number) {
    console.log('[DEBUG Front] Llamando API con tallerId:', tallerId);
    this.incidenteService.obtenerIncidentesTaller(tallerId).subscribe({
      next: (incidentes) => {
        console.log('[DEBUG Front] Incidentes recibidos:', incidentes);
        console.log('[DEBUG Front] Total incidentes:', incidentes.length);
        this.incidentesFiltrados.set(incidentes);
        this._loading.set(false);
      },
      error: (err) => {
        console.error('[DEBUG Front] Error:', err);
        this._loading.set(false);
      }
    });
  }

  filtrarPorEstado(event: Event) {
    const estado = (event.target as HTMLSelectElement).value;
    this.filtroEstado.set(estado);
    
    if (estado) {
      const todos = this.incidentesFiltrados();
      this.incidentesFiltrados.set(todos.filter(i => i.estado === estado));
    } else {
      this.incidentesFiltrados.set(this.incidentesFiltrados());
    }
  }

  verDetalle(id: number) {
    this.router.navigate(['/taller/incidentes', id]);
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
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}