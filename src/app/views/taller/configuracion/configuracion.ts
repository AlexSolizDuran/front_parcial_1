import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { ModalCrearTaller } from '../../../components/modal-crear-taller/modal-crear-taller';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { ModalUbicacion } from '../../../components/modal-ubicacion/modal-ubicacion';
import { TallerUpdate } from '../../../models/taller.model';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearTaller, Sidebar, ModalUbicacion],
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

  nombreTaller = signal('');
  telefonoTaller = signal('');
  horarioTaller = signal('');
  latTaller = signal(0);
  lngTaller = signal(0);

  get showModal() {
    return this.tallerService.showModalTaller;
  }

  get taller() {
    return this.tallerService.taller;
  }

  get collapsed() {
    return this.sidebarService.collapsed;
  }

  ngOnInit() {
    this.tallerService.checkMiTaller().subscribe(() => {
      const t = this.tallerService.taller();
      if (t) {
        this.nombreTaller.set(t.nombre);
        this.telefonoTaller.set(t.telefono || '');
        this.horarioTaller.set(t.horario_atencion || '');
        this.latTaller.set(t.ubicacion_lat);
        this.lngTaller.set(t.ubicacion_lng);
      }
      this.loading.set(false);
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
