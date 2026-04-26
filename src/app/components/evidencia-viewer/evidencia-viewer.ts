import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
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
export class EvidenciaViewerComponent implements OnInit {
  @Input() evidencias: Evidencia[] = [];
  @Output() verAmpliado = new EventEmitter<Evidencia>();

  private apiUrl = environment.apiUrl;
  selectedIndex = 0;
  imagenError = false;

  ngOnInit() {
    console.log('Evidencias recibidas:', this.evidencias);
    if (this.evidencias.length > 0) {
      console.log('Primera evidencia:', this.evidencias[0]);
      console.log('URL de archivo:', this.evidencias[0].url_archivo);
    }
  }

  get evidenciaActual(): Evidencia | null {
    return this.evidencias[this.selectedIndex] || null;
  }

  getFullUrl(url: string | null | undefined): string {
    if (!url) {
      console.warn('URL de archivo vacía o nula');
      return '';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('URL completa (Cloudinary):', url);
      return url;
    }
    console.log('URL relativa, agregando apiUrl:', this.apiUrl, url);
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

  onImageError(event: Event) {
    console.error('Error cargando imagen:', this.evidenciaActual?.url_archivo);
    this.imagenError = true;
  }

  onImageLoad() {
    this.imagenError = false;
  }

  playAudio(evidencia: Evidencia) {
    const url = this.getFullUrl(evidencia.url_archivo);
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  }
}