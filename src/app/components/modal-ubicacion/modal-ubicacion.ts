import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-ubicacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (show) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" (click)="cerrar()"></div>
        <div
          class="relative bg-white dark:bg-[#2e3133] rounded-xl shadow-2xl w-full max-w-lg p-4 max-h-[90vh] overflow-y-auto"
        >
          <h3 class="text-lg font-bold text-on-surface dark:text-white mb-3">
            Seleccionar ubicación
          </h3>
          <p class="text-sm text-gray-500 mb-3">
            Ingresa las coordenadas o usa tu ubicación actual
          </p>

          <div class="space-y-3">
            <button
              type="button"
              (click)="obtenerUbicacion()"
              class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 w-full"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Usar mi ubicación actual
            </button>

            <div
              class="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
            >
              <iframe
                [src]="mapUrl()"
                width="100%"
                height="250"
                style="border:0;"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <a
              [href]="openStreetMapUrl()"
              target="_blank"
              class="block text-center text-xs text-blue-600 hover:underline"
            >
              Abrir en OpenStreetMap ↗
            </a>

            <div class="flex gap-4 text-sm">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Latitud</label>
                <input
                  type="number"
                  step="0.000001"
                  [(ngModel)]="latitud"
                  (ngModelChange)="onCoordsChange()"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#191c1e] text-on-surface dark:text-white text-sm"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Longitud</label>
                <input
                  type="number"
                  step="0.000001"
                  [(ngModel)]="longitud"
                  (ngModelChange)="onCoordsChange()"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#191c1e] text-on-surface dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-3 mt-4">
            <button
              (click)="cerrar()"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              (click)="guardar()"
              class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalUbicacion {
  @Input() show = false;
  @Input() set latitudInput(v: number) {
    this.latitud = v;
  }
  @Input() set longitudInput(v: number) {
    this.longitud = v;
  }
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ lat: number; lng: number }>();

  latitud = -12.0464;
  longitud = -77.0428;

  mapUrl = signal('');
  openStreetMapUrl = signal('');

  ngOnChanges() {
    this.updateUrls();
  }

  private updateUrls() {
    const lat = this.latitud;
    const lng = this.longitud;
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
    this.mapUrl.set(embedUrl);
    this.openStreetMapUrl.set(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`,
    );
  }

  onCoordsChange() {
    this.updateUrls();
  }

  obtenerUbicacion() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitud = position.coords.latitude;
        this.longitud = position.coords.longitude;
        this.updateUrls();
      },
      (error) => alert('Error: ' + error.message),
    );
  }

  cerrar() {
    this.closed.emit();
  }

  guardar() {
    this.saved.emit({ lat: this.latitud, lng: this.longitud });
  }
}
