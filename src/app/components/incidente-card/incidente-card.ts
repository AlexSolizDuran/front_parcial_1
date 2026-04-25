import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenteAsignado } from '../../models/incidente-asignado.model';
import { IncidenteTallerService } from '../../services/incidente-taller.service';

@Component({
  selector: 'app-incidente-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incidente-card.html',
  styleUrl: './incidente-card.css',
})
export class IncidenteCardComponent {
  @Input() incidente!: IncidenteAsignado;
  @Output() verDetalle = new EventEmitter<number>();

  constructor(private service: IncidenteTallerService) {}

  getColorEstado(): string {
    return this.service.getColorEstado(this.incidente.estado);
  }

  getLabelEstado(): string {
    return this.service.getLabelEstado(this.incidente.estado);
  }

  getColorPrioridad(): string {
    return this.service.getColorPrioridad(this.incidente.prioridad);
  }

  getLabelPrioridad(): string {
    return this.service.getLabelPrioridad(this.incidente.prioridad);
  }

  getFechaFormateada(): string {
    return this.service.formatDate(this.incidente.fecha_creacion);
  }

  getClienteNombre(): string {
    return this.incidente.cliente?.nombre || 'Cliente desconocido';
  }

  getVehiculoDesc(): string {
    if (!this.incidente.vehiculo) return 'Sin vehículo';
    const v = this.incidente.vehiculo;
    const partes = [v.marca, v.modelo, v.patente].filter(Boolean);
    return partes.length > 0 ? partes.join(' ') : 'Sin vehículo';
  }

  getTecnicoNombre(): string {
    if (!this.incidente.asignacion?.tecnico) return 'Sin asignar';
    return this.incidente.asignacion.tecnico.nombre || 'Sin asignar';
  }

  getEstadoIcono(): string {
    switch (this.incidente.estado) {
      case 'asignado': return '📋';
      case 'en_camino': return '🚗';
      case 'en_sitio': return '🔧';
      case 'finalizado': return '✅';
      default: return '📌';
    }
  }

  onVerDetalle() {
    this.verDetalle.emit(this.incidente.id);
  }
}