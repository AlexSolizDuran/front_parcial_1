import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Evidencia } from '../../models/incidente-asignado.model';
import { environment } from '../../../environments/environment';

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

  private apiUrl = environment.apiUrl;
  selectedIndex = 0;

  get evidenciaActual(): Evidencia | null {
    return this.evidencias[this.selectedIndex] || null;
  }

  getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.apiUrl}${url}`;
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
    const url = this.getFullUrl(evidencia.url_archivo);
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  }
}