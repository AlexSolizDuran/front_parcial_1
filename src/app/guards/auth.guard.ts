import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolEnum } from '../models/usuario.model';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. Intentamos obtener el usuario del Signal
  let user = authService.user();
  let isAuthenticated = authService.isAuthenticated();

  // 2. Si el Signal está vacío (pasó al recargar), intentamos recuperar de LocalStorage
  if (!isAuthenticated && isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      // Si existen en disco, permitimos el paso.
      // El constructor del AuthService se encargará de actualizar los Signals en milisegundos.
      isAuthenticated = true;
      user = JSON.parse(userStr);
    }
  }

  // 3. Verificación de Autenticación
  if (!isAuthenticated) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // 4. Verificación de Rol (Autorización)
  const expectedRole = route.data['role'] as RolEnum;
  if (expectedRole && user?.rol !== expectedRole) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};
