import { Component, Input, Output, EventEmitter, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenteTallerService, AsignacionPendiente } from '../../services/incidente-taller.service';

@Component({
  selector: 'app-incidente-pendiente-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incidente-pendiente-card.html',
  styleUrl: './incidente-pendiente-card.css'
})
export class IncidentePendienteCardComponent implements OnInit, OnDestroy {
  @Input() asignacionPendiente: AsignacionPendiente | null = null;
  @Output() aceptar = new EventEmitter<number>();
  @Output() rechazar = new EventEmitter<number>();
  @Output() verDetalles = new EventEmitter<void>();
  @Output() expirado = new EventEmitter<void>();

  tiempoRestante = signal(0);
  private intervalId: any;

ngOnInit() {
     if (this.asignacionPendiente) {
       this.tiempoRestante.set(this.asignacionPendiente.tiempo_restante_segundos);
       this.startTimer();
     }
   }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    this.intervalId = setInterval(() => {
      const current = this.tiempoRestante();
      if (current > 0) {
        this.tiempoRestante.set(current - 1);
      } else {
        this.stopTimer();
        this.expirado.emit();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getColorPrioridad(prioridad: string | null | undefined): string {
    if (!prioridad) return 'bg-gray-100 text-gray-800';
    const colores: Record<string, string> = {
      'urgente': 'bg-red-500 text-white',
      'alta': 'bg-orange-500 text-white',
      'media': 'bg-yellow-500 text-black',
      'baja': 'bg-green-500 text-white'
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-800';
  }

  getLabelPrioridad(prioridad: string | null | undefined): string {
    if (!prioridad) return 'Sin prioridad';
    const labels: Record<string, string> = {
      'urgente': 'Urgente',
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja'
    };
    return labels[prioridad] || prioridad;
  }

onAceptar() {
     if (this.asignacionPendiente) {
       this.aceptar.emit(this.asignacionPendiente.asignacion.id);
     }
   }

onRechazar() {
     if (this.asignacionPendiente) {
       this.rechazar.emit(this.asignacionPendiente.asignacion.id);
     }
   }

  onVerDetalles() {
    this.verDetalles.emit();
  }
}