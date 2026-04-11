import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TallerService } from '../../services/taller.service';
import { TallerCreate } from '../../models/taller.model';

@Component({
  selector: 'app-modal-crear-taller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-taller.html',
})
export class ModalCrearTaller implements OnInit {
  public tallerService = inject(TallerService);

  nombre = signal('');
  especialidad = signal('');
  telefono = signal('');
  horario = signal('');
  lat = signal(-12.0464);
  lng = signal(-77.0428);
  loading = signal(false);
  error = signal('');

  ngOnInit() {}

  get showModal() {
    return this.tallerService.showModalTaller;
  }

  close() {
    if (!this.loading()) {
      this.error.set('Debes crear un taller para continuar');
    }
  }

  onSubmit() {
    this.error.set('');

    if (!this.nombre() || !this.especialidad()) {
      this.error.set('Completa los campos requeridos');
      return;
    }

    const data: TallerCreate = {
      nombre: this.nombre(),
      especialidad: this.especialidad(),
      telefono: this.telefono() || undefined,
      horario_atencion: this.horario() || undefined,
      ubicacion_lat: this.lat(),
      ubicacion_lng: this.lng(),
    };

    this.loading.set(true);
    this.tallerService.crearTaller(data).subscribe({
      next: () => {
        this.loading.set(false);
        window.location.reload();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Error al crear taller');
      },
    });
  }

  get Especialidades() {
    return [
      'Mecánica general',
      'Electricidad',
      'Enderezado y pintura',
      'Cambio de aceite',
      'Frenos',
      'Suspensión',
      'Transmisión',
      'Aire acondicionado',
      'Todo terreno',
    ];
  }
}
