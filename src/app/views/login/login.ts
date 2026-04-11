import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TallerService } from '../../services/taller.service';
import { RolEnum } from '../../models/usuario.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = signal('');
  password = signal('');
  error = signal('');

  constructor(
    public authService: AuthService,
    private tallerService: TallerService,
    private router: Router,
  ) {}

  onSubmit() {
    this.error.set('');

    if (!this.username() || !this.password()) {
      this.error.set('Por favor complete todos los campos');
      return;
    }

    this.authService
      .login({
        username: this.username(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          const user = this.authService.user();
          if (user && user.rol === RolEnum.dueno) {
            if (user.taller_id) {
              this.router.navigate(['/dashboard']);
            } else {
              this.tallerService.checkMiTaller().subscribe();
              this.router.navigate(['/dashboard']);
            }
          } else {
            this.authService.logout();
            this.error.set('Solo los dueños de taller pueden acceder');
          }
        },
        error: (err) => {
          this.error.set(err.error?.detail || 'Usuario o contraseña incorrectos');
        },
      });
  }
}
