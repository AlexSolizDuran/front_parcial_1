import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { ModalCrearTaller } from '../../../components/modal-crear-taller/modal-crear-taller';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { TecnicoService } from '../../../services/tecnico.service';
import { UsuarioCreate, RolEnum } from '../../../models/usuario.model';
import { Tecnico } from '../../../models/tecnico.model';

@Component({
  selector: 'app-tecnicos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearTaller, Sidebar],
  templateUrl: './tecnicos.html',
  styleUrl: './tecnicos.css',
})
export class Tecnicos implements OnInit {
  authService = inject(AuthService);
  tallerService = inject(TallerService);
  tecnicoService = inject(TecnicoService);
  sidebarService = inject(SidebarService);
  loading = signal(true);
  showModalCrear = signal(false);
  showModalDetalle = signal(false);
  showModalEditar = signal(false);
  tecnicoSeleccionado = signal<Tecnico | null>(null);

  nombre = signal('');
  username = signal('');
  email = signal('');
  telefono = signal('');
  password = signal('');
  confirmPassword = signal('');

  editNombre = signal('');
  editEmail = signal('');
  editTelefono = signal('');

  saving = signal(false);
  error = signal('');

  get showModal() {
    return this.tallerService.showModalTaller;
  }

  get collapsed() {
    return this.sidebarService.collapsed;
  }

  ngOnInit() {
    this.tallerService.checkMiTaller().subscribe(() => {
      this.tecnicoService.getTecnicos().subscribe(() => {
        this.loading.set(false);
      });
    });
  }

  crearTecnico() {
    this.error.set('');

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    if (!this.nombre() || !this.username() || !this.email() || !this.password()) {
      this.error.set('Completa los campos requeridos');
      return;
    }

    this.saving.set(true);

    const userData: UsuarioCreate = {
      nombre: this.nombre(),
      username: this.username(),
      email: this.email(),
      telefono: this.telefono() || undefined,
      password: this.password(),
      rol: RolEnum.tecnico,
    };

    this.authService.register(userData).subscribe({
      next: (user) => {
        this.tecnicoService.crearTecnicoConUsuarioId(user.id).subscribe({
          next: () => {
            this.saving.set(false);
            this.showModalCrear.set(false);
            this.resetForm();
            this.tecnicoService.getTecnicos().subscribe();
          },
          error: (err) => {
            this.saving.set(false);
            this.error.set(err.error?.detail || 'Error al crear técnico');
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.detail || 'Error al crear usuario');
      },
    });
  }

  resetForm() {
    this.nombre.set('');
    this.username.set('');
    this.email.set('');
    this.telefono.set('');
    this.password.set('');
    this.confirmPassword.set('');
  }

  toggleDisponibilidad(tecnico: Tecnico) {
    this.tecnicoService.actualizarDisponibilidad(tecnico.id, !tecnico.disponible).subscribe();
  }

  openModalCrear() {
    this.resetForm();
    this.error.set('');
    this.showModalCrear.set(true);
  }

  openModalDetalle(tecnico: Tecnico) {
    this.tecnicoSeleccionado.set(tecnico);
    this.showModalDetalle.set(true);
  }

  openModalEditar(tecnico: Tecnico) {
    this.tecnicoSeleccionado.set(tecnico);
    this.editNombre.set(tecnico.usuario?.nombre || '');
    this.editEmail.set(tecnico.usuario?.email || '');
    this.editTelefono.set(tecnico.usuario?.telefono || '');
    this.error.set('');
    this.showModalEditar.set(true);
  }

  guardarEdicion() {
    const tecnico = this.tecnicoSeleccionado();
    if (!tecnico || !tecnico.usuario_id) {
      this.error.set('Error: técnico sin usuario');
      return;
    }

    this.saving.set(true);
    this.authService
      .actualizarUsuario(tecnico.usuario_id, {
        nombre: this.editNombre(),
        email: this.editEmail(),
        telefono: this.editTelefono() || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showModalEditar.set(false);
          this.tecnicoService.getTecnicos().subscribe();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.detail || 'Error al actualizar');
        },
      });
  }

  eliminarTecnico(tecnico: Tecnico) {
    if (confirm('¿Estás seguro de eliminar este técnico?')) {
      this.tecnicoService.eliminarTecnico(tecnico.id).subscribe({
        next: () => {
          if (tecnico.usuario_id) {
            console.log('PARA SABER SI FUE ELIMINADO');
            console.log(tecnico);
            this.authService.eliminarUsuario(tecnico.usuario_id).subscribe();
          }
        },
        error: (err) => {
          alert(err.error?.detail || 'Error al eliminar técnico');
        },
      });
    }
  }
}
