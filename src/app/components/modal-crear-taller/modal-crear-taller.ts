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
  telefono = signal('');
  horario = signal('');
  lat = signal(-12.0464);
  lng = signal(-77.0428);
  loading = signal(false);
  error = signal('');
  
  selectedEspecialidades = signal<number[]>([]);

  ngOnInit() {
    this.tallerService.obtenerEspecialidades().subscribe();
  }

  get especialidades() {
    return this.tallerService.especialidades();
  }

  isSelected(id: number): boolean {
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

  obtenerUbicacionActual() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.lat.set(position.coords.latitude);
        this.lng.set(position.coords.longitude);
      },
      (error) => {
        alert('No se pudo obtener tu ubicación: ' + error.message);
      }
    );
  }

  onUbicacionGuardada(location: { lat: number; lng: number }) {
    this.lat.set(location.lat);
    this.lng.set(location.lng);
  }

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

    if (!this.nombre()) {
      this.error.set('El nombre es requerido');
      return;
    }

    if (this.selectedEspecialidades().length === 0) {
      this.error.set('Selecciona al menos una especialidad');
      return;
    }

    const data: TallerCreate = {
      nombre: this.nombre(),
      telefono: this.telefono() || undefined,
      horario_atencion: this.horario() || undefined,
      ubicacion_lat: this.lat(),
      ubicacion_lng: this.lng(),
      especialidades: this.selectedEspecialidades(),
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
}