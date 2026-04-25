import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { ModalCrearTaller } from '../../../components/modal-crear-taller/modal-crear-taller';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { TallerUpdate, Especialidad } from '../../../models/taller.model';

// 1. IMPORTAMOS LEAFLET
import * as L from 'leaflet';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearTaller, Sidebar],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  authService = inject(AuthService);
  tallerService = inject(TallerService);
  sidebarService = inject(SidebarService);

  loading = signal(true);
  editing = signal(false);
  saving = signal(false);
  showModalUbicacion = signal(false);
  showModalNuevaEspecialidad = signal(false);

  nombreTaller = signal('');
  telefonoTaller = signal('');
  horarioTaller = signal('');
  latTaller = signal(0);
  lngTaller = signal(0);

  nuevaEspecialidadNombre = signal('');
  nuevaEspecialidadDescripcion = signal('');

  selectedEspecialidades = signal<number[]>([]);

  // 2. VARIABLES PRIVADAS PARA EL MAPA
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  get showModal() {
    return this.tallerService.showModalTaller;
  }

  get taller() {
    return this.tallerService.taller;
  }

  get collapsed() {
    return this.sidebarService.collapsed;
  }

  get especialidades() {
    return this.tallerService.especialidades();
  }

  ngOnInit() {
    this.tallerService.obtenerEspecialidades();

    this.tallerService.checkMiTaller().subscribe(() => {
      const t = this.tallerService.taller();
      if (t) {
        this.nombreTaller.set(t.nombre);
        this.telefonoTaller.set(t.telefono || '');
        this.horarioTaller.set(t.horario_atencion || '');
        this.latTaller.set(t.ubicacion_lat);
        this.lngTaller.set(t.ubicacion_lng);
        this.selectedEspecialidades.set(t.especialidades.map((e) => e.id));

        // 3. INICIAMOS EL MAPA DESPUÉS DE QUE EL DOM RENDERICE EL TALLER
        // Usamos setTimeout para darle 100ms a Angular de dibujar el <div id="mapa-taller">
        setTimeout(() => {
          this.iniciarMapa();
        }, 100);
      }
      this.loading.set(false);
    });
  }

  // --- 4. FUNCIÓN CENTRAL DEL MAPA ---
  private iniciarMapa() {
    // Si no hay coordenadas (0,0), centramos por defecto en Santa Cruz
    const lat = this.latTaller() !== 0 ? this.latTaller() : -17.7833;
    const lng = this.lngTaller() !== 0 ? this.lngTaller() : -63.1821;

    // Inicializar el mapa
    this.map = L.map('mapa-taller').setView([lat, lng], 14);

    // Cargar la capa visual de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Configurar icono estándar
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    // Añadir el marcador
    this.marker = L.marker([lat, lng], {
      icon: icon,
      draggable: this.editing(), // Solo arrastrable si estamos en modo edición
    }).addTo(this.map);

    // Evento: Al hacer click en el mapa (solo si editamos)
    this.map.on('click', (e: any) => {
      if (!this.editing()) return;
      const coords = e.latlng;
      this.marker?.setLatLng(coords);
      this.latTaller.set(coords.lat);
      this.lngTaller.set(coords.lng);
    });

    // Evento: Al terminar de arrastrar el marcador (solo si editamos)
    this.marker.on('dragend', () => {
      if (!this.marker) return;
      const coords = this.marker.getLatLng();
      this.latTaller.set(coords.lat);
      this.lngTaller.set(coords.lng);
    });
  }
  // ------------------------------------

  isEspecialidadSelected(id: number): boolean {
    return this.selectedEspecialidades().includes(id);
  }

  toggleEspecialidad(id: number) {
    const current = this.selectedEspecialidades();
    if (current.includes(id)) {
      this.selectedEspecialidades.set(current.filter((e) => e !== id));
    } else {
      this.selectedEspecialidades.set([...current, id]);
    }
  }

  guardarEspecialidades() {
    const taller = this.tallerService.taller();
    if (!taller) return;

    this.saving.set(true);
    this.tallerService
      .actualizarEspecialidadesTaller(taller.id, this.selectedEspecialidades())
      .subscribe({
        next: () => {
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  openModalNuevaEspecialidad() {
    this.nuevaEspecialidadNombre.set('');
    this.nuevaEspecialidadDescripcion.set('');
    this.showModalNuevaEspecialidad.set(true);
  }

  closeModalNuevaEspecialidad() {
    this.showModalNuevaEspecialidad.set(false);
  }

  crearNuevaEspecialidad() {
    const nombre = this.nuevaEspecialidadNombre().trim();
    if (!nombre) return;

    this.tallerService
      .crearEspecialidad({
        nombre: nombre,
        descripcion: this.nuevaEspecialidadDescripcion() || undefined,
      })
      .subscribe({
        next: (esp) => {
          this.selectedEspecialidades.update((list) => [...list, esp.id]);
          this.closeModalNuevaEspecialidad();
          this.guardarEspecialidades();
        },
        error: () => {
          alert('Error al crear especialidad');
        },
      });
  }

  // 5. AJUSTES AL ENTRAR EN MODO EDICIÓN
  enableEdit() {
    this.editing.set(true);
    this.marker?.dragging?.enable(); // Habilitar movimiento del pin
  }

  // 6. AJUSTES AL CANCELAR EDICIÓN
  cancelEdit() {
    const t = this.tallerService.taller();
    if (t) {
      this.nombreTaller.set(t.nombre);
      this.telefonoTaller.set(t.telefono || '');
      this.horarioTaller.set(t.horario_atencion || '');
      this.latTaller.set(t.ubicacion_lat);
      this.lngTaller.set(t.ubicacion_lng);

      // Devolver el marcador y el mapa a su posición original
      this.marker?.setLatLng([t.ubicacion_lat, t.ubicacion_lng]);
      this.map?.setView([t.ubicacion_lat, t.ubicacion_lng], 14);
    }
    this.editing.set(false);
    this.marker?.dragging?.disable(); // Bloquear movimiento
  }

  openModalUbicacion() {
    this.showModalUbicacion.set(true);
  }

  closeModalUbicacion() {
    this.showModalUbicacion.set(false);
  }

  onUbicacionSaved(location: { lat: number; lng: number }) {
    this.latTaller.set(location.lat);
    this.lngTaller.set(location.lng);
    this.showModalUbicacion.set(false);
  }

  // 7. ACTUALIZAR MAPA CUANDO SE USA EL GPS
  obtenerUbicacionActual() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.latTaller.set(lat);
        this.lngTaller.set(lng);

        // Mover el mapa y el marcador a la nueva posición del GPS
        this.marker?.setLatLng([lat, lng]);
        this.map?.setView([lat, lng], 14);

        this.showModalUbicacion.set(false);
      },
      (error) => {
        alert('No se pudo obtener su ubicación: ' + error.message);
      },
    );
  }

  // 8. BLOQUEAR MARCADOR AL GUARDAR
  guardarCambios() {
    const taller = this.tallerService.taller();
    if (!taller) return;

    this.saving.set(true);

    const data: TallerUpdate = {
      nombre: this.nombreTaller(),
      telefono: this.telefonoTaller() || undefined,
      horario_atencion: this.horarioTaller() || undefined,
      ubicacion_lat: this.latTaller(),
      ubicacion_lng: this.lngTaller(),
    };

    this.tallerService.actualizarTaller(taller.id, data).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.marker?.dragging?.disable(); // Bloquear movimiento tras guardar
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
