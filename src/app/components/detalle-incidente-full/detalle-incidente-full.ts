import { Component, Input, Output, EventEmitter, OnInit, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenteTallerService, AsignacionPendiente, Evidencia } from '../../services/incidente-taller.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-detalle-incidente-full',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-incidente-full.html',
  styleUrl: './detalle-incidente-full.css'
})
export class DetalleIncidenteFullComponent implements OnInit, AfterViewInit {
  @Input() asignacion!: AsignacionPendiente;
  @Output() cerrar = new EventEmitter<void>();
  @Output() aceptar = new EventEmitter<number>();
  @Output() rechazar = new EventEmitter<number>();

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  private initMap() {
    if (!this.mapContainer || !this.asignacion) return;

    const lat = this.asignacion.incidente.ubicacion_lat;
    const lng = this.asignacion.incidente.ubicacion_lng;

    this.map = L.map(this.mapContainer.nativeElement, {
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const icon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41]
    });

    this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  getEvidenciasFotos(): Evidencia[] {
    return this.asignacion.incidente.evidencias.filter(e => e.tipo === 'foto');
  }

  getEvidenciasAudio(): Evidencia[] {
    return this.asignacion.incidente.evidencias.filter(e => e.tipo === 'audio');
  }

  getEvidenciasTexto(): Evidencia[] {
    return this.asignacion.incidente.evidencias.filter(e => e.tipo === 'texto');
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

  onCerrar() {
    this.cerrar.emit();
  }

  onAceptar() {
    this.aceptar.emit(this.asignacion.asignacion.id);
  }

  onRechazar() {
    this.rechazar.emit(this.asignacion.asignacion.id);
  }
}