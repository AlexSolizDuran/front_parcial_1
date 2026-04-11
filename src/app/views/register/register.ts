import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RolEnum, UsuarioCreate } from '../../models/usuario.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  username = signal('');
  email = signal('');
  nombre = signal('');
  phone = signal('');
  password = signal('');
  confirmPassword = signal('');
  error = signal('');
  success = signal('');

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  onSubmit() {
    this.error.set('');
    this.success.set('');

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    if (!this.nombre() || !this.email() || !this.password() || !this.username()) {
      this.error.set('Por favor complete todos los campos');
      return;
    }

    const data: UsuarioCreate = {
      email: this.email(),
      username: this.username(),
      nombre: this.nombre(),
      telefono: this.phone(),
      password: this.password(),
      rol: RolEnum.dueno,
    };

    this.authService.register(data).subscribe({
      next: () => {
        this.success.set('Usuario registrado correctamente');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Error al registrar');
      },
    });
  }
}
