import { Component, Input, Output, EventEmitter, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleIncidente, IncidenteAsignado } from '../../models/incidente-asignado.model';
import { IncidenteTallerService } from '../../services/incidente-taller.service';
import { MapaIncidenteComponent } from '../mapa-incidente/mapa-incidente';
import { EvidenciaViewerComponent } from '../evidencia-viewer/evidencia-viewer';
import { HistorialTimelineComponent } from '../historial-timeline/historial-timeline';
import { firstValueFrom, timeout, catchError } from 'rxjs';

@Component({
  selector: 'app-detalle-incidente-modal',
  standalone: true,
  imports: [
    CommonModule,
    MapaIncidenteComponent,
    EvidenciaViewerComponent,
    HistorialTimelineComponent
  ],
  templateUrl: './detalle-incidente-modal.html',
  styleUrl: './detalle-incidente-modal.css',
})
export class DetalleIncidenteModalComponent implements OnDestroy {
  private service = inject(IncidenteTallerService);

  detalle: DetalleIncidente | null = null;
  loading = signal(false);
  private incidenteId: number = 0;
  private _incidente: IncidenteAsignado | null = null;

  // Setter for incidente to ensure proper change detection
  @Input()
  set incidente(value: IncidenteAsignado | null) {
    console.log('Setter incidente llamado con:', value?.id, 'valor anterior:', this._incidente?.id);
    this._incidente = value;
    this.detalle = null;
    this.loading.set(false);
    if (value?.id) {
      this.incidenteId = value.id;
      this.cargarDetalle();
    }
  }

  get incidente(): IncidenteAsignado | null {
    return this._incidente;
  }

  @Input() tallerId: number = 0;
  @Output() cerrar = new EventEmitter<void>();
  @Output() estadoCambiado = new EventEmitter<number>();

  ngOnDestroy() {}

  private async cargarDetalle() {
    if (!this.incidenteId) {
      console.warn('No hay incidenteId válido, cancelando carga');
      this.loading.set(false);
      return;
    }

    console.log('Cargando detalle de incidente ID:', this.incidenteId);
    this.loading.set(true);
    this.detalle = null;

    try {
      const data = await firstValueFrom(
        this.service.obtenerDetalleIncidente(this.incidenteId).pipe(
          timeout(10000),
          catchError(err => {
            console.error('Error en Observable:', err);
            throw err;
          })
        )
      );
      console.log('Respuesta exitosa del backend:', data);
      this.detalle = data;
      
      // Log de evidencias para debug
      if (data && data.evidencias) {
        console.log('Evidencias recibidas:', data.evidencias.length);
        data.evidencias.forEach((ev: any, idx: number) => {
          console.log(`Evidencia ${idx}:`, ev.tipo, ev.url_archivo);
        });
      } else {
        console.warn('No se recibieron evidencias en la respuesta');
      }
    } catch (error: any) {
      console.error('Error al cargar detalle:', error);
      if (error.status === 0) {
        console.error('Error de conexión - ¿Está el backend corriendo en http://localhost:8000?');
      }
    } finally {
      console.log('Finalizando carga, setting loading=false');
      this.loading.set(false);
    }
  }

  onCerrar() {
    this.cerrar.emit();
  }

  getColorEstado(): string {
    const estado = this.detalle?.estado || this.incidente?.estado || 'reportado';
    return this.service.getColorEstado(estado);
  }

  getLabelEstado(): string {
    const estado = this.detalle?.estado || this.incidente?.estado || 'reportado';
    return this.service.getLabelEstado(estado);
  }

  getColorPrioridad(): string {
    const prioridad = this.detalle?.prioridad || this.incidente?.prioridad || 'media';
    return this.service.getColorPrioridad(prioridad);
  }

  getLabelPrioridad(): string {
    const prioridad = this.detalle?.prioridad || this.incidente?.prioridad || 'media';
    return this.service.getLabelPrioridad(prioridad);
  }

  getClienteNombre(): string {
    return this.detalle?.cliente?.nombre || this.incidente?.cliente?.nombre || 'Sin nombre';
  }

  getClienteTelefono(): string | null {
    return this.detalle?.cliente?.telefono || this.incidente?.cliente?.telefono || null;
  }

  getVehiculo(): string {
    const v = this.detalle?.vehiculo || this.incidente?.vehiculo;
    if (!v) return 'Sin vehículo';
    return `${v.marca || ''} ${v.modelo || ''} ${v.patente || ''}`.trim();
  }

  getVehiculoDesc(): string {
    return this.getVehiculo();
  }

  getVehiculoPatente(): string | null {
    const v = this.detalle?.vehiculo || this.incidente?.vehiculo;
    return v?.patente || null;
  }

  getTecnicoTelefono(): string | null {
    return this.detalle?.tecnico?.telefono || 
           this.incidente?.asignacion?.tecnico?.telefono || 
           null;
  }

  getTecnicoNombre(): string {
    return this.detalle?.tecnico?.nombre || this.incidente?.asignacion?.tecnico?.nombre || 'Sin asignar';
  }

  getEvidencias() {
    return this.detalle?.evidencias || [];
  }

  getHistorial() {
    return this.detalle?.historial || [];
  }

  llamarCliente() {
    const telefono = this.getClienteTelefono();
    if (telefono) {
      window.open(`tel:${telefono}`, '_self');
    }
  }

  llamarTecnico() {
    const telefono = this.getTecnicoTelefono();
    if (telefono) {
      window.open(`tel:${telefono}`, '_self');
    }
  }

  cambiarEstado(nuevoEstado: string) {
    const incidenteId = this.detalle?.id || this.incidente?.id;
    if (!incidenteId) return;
    
    this.service.cambiarEstadoIncidente(incidenteId, nuevoEstado).subscribe({
      next: () => {
        this.estadoCambiado.emit(incidenteId);
        this.onCerrar();
      },
      error: (err) => {
        console.error('Error cambiando estado:', err);
        alert('Error al cambiar estado');
      }
    });
  }
}