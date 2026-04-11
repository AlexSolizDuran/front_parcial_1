import {
  Component,
  signal,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-3">
      <div class="flex gap-2">
        <button
          type="button"
          (click)="obtenerUbicacion()"
          class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Usar mi ubicación
        </button>
      </div>

      <div
        id="mapa-selector"
        class="w-full h-64 rounded-lg border border-gray-300 dark:border-gray-600"
      ></div>

      <div class="flex gap-4 text-sm">
        <div class="flex-1">
          <label class="block text-xs text-gray-500 mb-1">Latitud</label>
          <input
            type="text"
            [value]="lat()"
            readonly
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#191c1e] text-on-surface dark:text-white text-sm"
          />
        </div>
        <div class="flex-1">
          <label class="block text-xs text-gray-500 mb-1">Longitud</label>
          <input
            type="text"
            [value]="lng()"
            readonly
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#191c1e] text-on-surface dark:text-white text-sm"
          />
        </div>
      </div>
    </div>
  `,
})
export class MapaSelector implements AfterViewInit, OnDestroy {
  @Input() set latitud(value: number) {
    this._lat.set(value);
    if (this.map && this.marker) {
      this.marker.setLatLng([value, this._lng()]);
      this.map.setView([value, this._lng()], 15);
    }
  }

  @Input() set longitud(value: number) {
    this._lng.set(value);
    if (this.map && this.marker) {
      this.marker.setLatLng([this._lat(), value]);
      this.map.setView([this._lat(), value], 15);
    }
  }

  @Output() locationChanged = new EventEmitter<{ lat: number; lng: number }>();

  _lat = signal(-12.0464);
  _lng = signal(-77.0428);

  lat = this._lat.asReadonly();
  lng = this._lng.asReadonly();

  private map!: L.Map;
  private marker!: L.Marker;

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    this.map = L.map('mapa-selector').setView([this._lat(), this._lng()], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.marker = L.marker([this._lat(), this._lng()], {
      icon: defaultIcon,
      draggable: true,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this._lat.set(e.latlng.lat);
      this._lng.set(e.latlng.lng);
      this.marker.setLatLng(e.latlng);
      this.locationChanged.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this._lat.set(pos.lat);
      this._lng.set(pos.lng);
      this.locationChanged.emit({ lat: pos.lat, lng: pos.lng });
    });
  }

  obtenerUbicacion() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this._lat.set(lat);
        this._lng.set(lng);

        if (this.map && this.marker) {
          this.marker.setLatLng([lat, lng]);
          this.map.setView([lat, lng], 16);
        }

        this.locationChanged.emit({ lat, lng });
      },
      (error) => {
        alert('No se pudo obtener tu ubicación: ' + error.message);
      },
    );
  }
}
