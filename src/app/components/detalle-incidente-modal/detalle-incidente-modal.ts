import { Component, Input, Output, EventEmitter, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleIncidente, IncidenteAsignado } from '../../models/incidente-asignado.model';
import { IncidenteTallerService } from '../../services/incidente-taller.service';
import { MapaIncidenteComponent } from '../mapa-incidente/mapa-incidente';
import { EvidenciaViewerComponent } from '../evidencia-viewer/evidencia-viewer';
import { HistorialTimelineComponent } from '../historial-timeline/historial-timeline';
import { firstValueFrom, timeout } from 'rxjs';

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
export class DetalleIncidenteModalComponent implements OnInit, OnDestroy {
  @Input() incidente: IncidenteAsignado | null = null;
  @Input() tallerId: number = 0;
  @Output() cerrar = new EventEmitter<void>();
  @Output() estadoCambiado = new EventEmitter<number>();

  private service = inject(IncidenteTallerService);

  detalle: DetalleIncidente | null = null;
  loading = true;
  private incidenteId: number = 0;
  private loadingTimeout: any = null;

  ngOnInit() {
    if (this.incidente?.id) {
      this.incidenteId = this.incidente.id;
      this.cargarDetalle();
    } else if (this.tallerId) {
      this.cargarDetalle();
    }
  }

  ngOnDestroy() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  async cargarDetalle() {
    if (!this.incidenteId) {
      this.loading = false;
      return;
    }
    
    this.loading = true;
    
    this.loadingTimeout = setTimeout(() => {
      if (this.loading) {
        console.warn('Timeout al cargar detalle del incidente');
        this.loading = false;
      }
    }, 10000);
    
    try {
      const data = await firstValueFrom(
        this.service.obtenerDetalleIncidente(this.incidenteId).pipe(
          timeout(8000)
        )
      );
      this.detalle = data;
    } catch (error: any) {
      console.error('Error al cargar detalle:', error);
    } finally {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
      }
      this.loading = false;
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