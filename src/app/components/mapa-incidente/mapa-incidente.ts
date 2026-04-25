import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-incidente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-incidente.html',
  styleUrl: './mapa-incidente.css',
})
export class MapaIncidenteComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  @Input() lat: number = -17.7833;
  @Input() lng: number = -63.1821;
  @Input() titulo: string = 'Ubicación del incidente';
  @Input() tecnicoLat: number | null = null;
  @Input() tecnicoLng: number | null = null;
  @Input() tecnicoNombre: string | null = null;
  
  @Output() mapReady = new EventEmitter<L.Map>();

  private map: L.Map | null = null;
  private markerIncidente: L.Marker | null = null;
  private markerTecnico: L.Marker | null = null;

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    if (!this.mapContainer?.nativeElement || this.map) return;

    this.map = L.map(this.mapContainer.nativeElement).setView([this.lat, this.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.addMarkers();
    this.mapReady.emit(this.map);
  }

  private addMarkers() {
    if (!this.map) return;

    const iconIncidente = L.divIcon({
      html: '<div class="marker-incidente">📍</div>',
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    this.markerIncidente = L.marker([this.lat, this.lng], { icon: iconIncidente })
      .bindPopup(`<b>${this.titulo}</b>`)
      .addTo(this.map);

    if (this.tecnicoLat && this.tecnicoLng) {
      const iconTecnico = L.divIcon({
        html: '<div class="marker-tecnico">🔧</div>',
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const popupText = this.tecnicoNombre 
        ? `<b>Técnico: ${this.tecnicoNombre}</b><br>Ubicación actual`
        : '<b>Técnico</b>';

      this.markerTecnico = L.marker([this.tecnicoLat, this.tecnicoLng], { icon: iconTecnico })
        .bindPopup(popupText)
        .addTo(this.map);

      this.map.fitBounds([
        [this.lat, this.lng],
        [this.tecnicoLat, this.tecnicoLng]
      ], { padding: [50, 50] });
    }
  }

  updateTecnicoUbicacion(lat: number, lng: number, nombre?: string) {
    if (this.markerTecnico) {
      this.markerTecnico.setLatLng([lat, lng]);
      if (nombre) {
        this.markerTecnico.setPopupContent(`<b>Técnico: ${nombre}</b><br>Ubicación actual`);
      }
    }
  }
}