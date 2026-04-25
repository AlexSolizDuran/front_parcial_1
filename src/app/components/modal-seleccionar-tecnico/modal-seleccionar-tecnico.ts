import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TecnicoService } from '../../services/tecnico.service';
import { Tecnico } from '../../models/tecnico.model';

@Component({
  selector: 'app-modal-seleccionar-tecnico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-seleccionar-tecnico.html',
  styleUrl: './modal-seleccionar-tecnico.css'
})
export class ModalSeleccionarTecnicoComponent implements OnInit {
  @Input() incidenteId: number = 0;
  @Output() tecnicoSeleccionado = new EventEmitter<number>();
  @Output() cerrar = new EventEmitter<void>();

  private tecnicoService = inject(TecnicoService);
  tecnicos = signal<Tecnico[]>([]);
  loading = signal(true);
  selectedTecnicoId = signal<number | null>(null);

  ngOnInit() {
    this.cargarTecnicos();
  }

  private cargarTecnicos() {
    this.tecnicoService.getTecnicos().subscribe({
      next: (tecnicos) => {
        this.tecnicos.set(tecnicos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  seleccionarTecnico(tecnicoId: number) {
    this.selectedTecnicoId.set(tecnicoId);
  }

  confirmarSeleccion() {
    const id = this.selectedTecnicoId();
    if (id) {
      this.tecnicoSeleccionado.emit(id);
    }
  }

  onCerrar() {
    this.cerrar.emit();
  }

  getNombreTecnico(tecnico: Tecnico): string {
    return tecnico.usuario?.nombre || `Tecnico #${tecnico.id}`;
  }

  isDisponible(tecnico: Tecnico): boolean {
    return tecnico.disponible;
  }
}
