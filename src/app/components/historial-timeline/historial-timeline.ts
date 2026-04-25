import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialItem } from '../../models/incidente-asignado.model';

@Component({
  selector: 'app-historial-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-timeline.html',
  styleUrl: './historial-timeline.css',
})
export class HistorialTimelineComponent {
  @Input() historial: HistorialItem[] = [];

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getIcono(titulo: string): string {
    const lowerTitulo = titulo.toLowerCase();
    if (lowerTitulo.includes('creado') || lowerTitulo.includes('reportado')) return '📌';
    if (lowerTitulo.includes('asignado')) return '📋';
    if (lowerTitulo.includes('aceptado')) return '✅';
    if (lowerTitulo.includes('camino')) return '🚗';
    if (lowerTitulo.includes('sitio') || lowerTitulo.includes('llegó')) return '🔧';
    if (lowerTitulo.includes('finalizado') || lowerTitulo.includes('completado')) return '✅';
    if (lowerTitulo.includes('cancelado')) return '❌';
    if (lowerTitulo.includes('rechazado')) return '❌';
    return '📝';
  }
}