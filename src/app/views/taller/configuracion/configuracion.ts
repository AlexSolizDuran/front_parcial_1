import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { ModalCrearTaller } from '../../../components/modal-crear-taller/modal-crear-taller';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { TallerUpdate, Especialidad } from '../../../models/taller.model';

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
        this.selectedEspecialidades.set(t.especialidades.map(e => e.id));
      }
      this.loading.set(false);
    });
  }

  isEspecialidadSelected(id: number): boolean {
    return this.selectedEspecialidades().includes(id);
  }

  toggleEspecialidad(id: number) {
    const current = this.selectedEspecialidades();
    if (current.includes(id)) {
      this.selectedEspecialidades.set(current.filter(e => e !== id));
    } else {
      this.selectedEspecialidades.set([...current, id]);
    }
  }

  guardarEspecialidades() {
    const taller = this.tallerService.taller();
    if (!taller) return;

    this.saving.set(true);
    this.tallerService.actualizarEspecialidadesTaller(taller.id, this.selectedEspecialidades()).subscribe({
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

    this.tallerService.crearEspecialidad({
      nombre: nombre,
      descripcion: this.nuevaEspecialidadDescripcion() || undefined
    }).subscribe({
      next: (esp) => {
        this.selectedEspecialidades.update(list => [...list, esp.id]);
        this.closeModalNuevaEspecialidad();
        this.guardarEspecialidades();
      },
      error: () => {
        alert('Error al crear especialidad');
      }
    });
  }

  enableEdit() {
    this.editing.set(true);
  }

  cancelEdit() {
    const t = this.tallerService.taller();
    if (t) {
      this.nombreTaller.set(t.nombre);
      this.telefonoTaller.set(t.telefono || '');
      this.horarioTaller.set(t.horario_atencion || '');
      this.latTaller.set(t.ubicacion_lat);
      this.lngTaller.set(t.ubicacion_lng);
    }
    this.editing.set(false);
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
        this.showModalUbicacion.set(false);
      },
      (error) => {
        alert('No se pudo obtener su ubicación: ' + error.message);
      }
    );
  }

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
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}