import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Evidencia } from '../../models/incidente-asignado.model';

@Component({
  selector: 'app-evidencia-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evidencia-viewer.html',
  styleUrl: './evidencia-viewer.css',
})
export class EvidenciaViewerComponent {
  @Input() evidencias: Evidencia[] = [];
  @Output() verAmpliado = new EventEmitter<Evidencia>();

  selectedIndex = 0;

  get evidenciaActual(): Evidencia | null {
    return this.evidencias[this.selectedIndex] || null;
  }

  selectEvidencia(index: number) {
    this.selectedIndex = index;
  }

  isFoto(evidencia: Evidencia): boolean {
    return evidencia.tipo === 'foto';
  }

  isAudio(evidencia: Evidencia): boolean {
    return evidencia.tipo === 'audio';
  }

  isTexto(evidencia: Evidencia): boolean {
    return evidencia.tipo === 'texto';
  }

  getIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'foto': return '📷';
      case 'audio': return '🎤';
      case 'texto': return '📝';
      default: return '📎';
    }
  }

  onVerAmpliado(evidencia: Evidencia) {
    this.verAmpliado.emit(evidencia);
  }

  playAudio(evidencia: Evidencia) {
    if (evidencia.url_archivo) {
      const audio = new Audio(evidencia.url_archivo);
      audio.play();
    }
  }
}