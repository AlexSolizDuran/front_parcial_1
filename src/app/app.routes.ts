import { Routes } from '@angular/router';
import { Inicio } from './views/inicio/inicio';
import { Login } from './views/login/login';
import { Register } from './views/register/register';
import { Dashboard } from './views/taller/dashboard/dashboard';
import { Tecnicos } from './views/taller/tecnicos/tecnicos';
import { Configuracion } from './views/taller/configuracion/configuracion';
import { Incidentes } from './views/taller/incidentes/incidentes';
import { DetalleIncidente } from './views/taller/incidentes/detalle-incidente';
import { MisIncidentes } from './views/cliente/incidentes/mis-incidentes';
import { authGuard } from './guards/auth.guard';
import { RolEnum } from './models/usuario.model';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  // Rutas de Taller (dueño)
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    data: { role: RolEnum.dueno },
  },
  {
    path: 'dashboard/tecnicos',
    component: Tecnicos,
    canActivate: [authGuard],
    data: { role: RolEnum.dueno },
  },
  {
    path: 'dashboard/configuracion',
    component: Configuracion,
    canActivate: [authGuard],
    data: { role: RolEnum.dueno },
  },
  {
    path: 'taller/incidentes',
    component: Incidentes,
    canActivate: [authGuard],
    data: { role: RolEnum.dueno },
  },
  {
    path: 'taller/incidentes/:id',
    component: DetalleIncidente,
    canActivate: [authGuard],
    data: { role: RolEnum.dueno },
  },
  // Rutas de Cliente
  {
    path: 'cliente/incidentes',
    component: MisIncidentes,
    canActivate: [authGuard],
    data: { role: RolEnum.cliente },
  },
  {
    path: 'cliente/incidentes/:id',
    component: DetalleIncidente,
    canActivate: [authGuard],
    data: { role: RolEnum.cliente },
  },
  { path: '**', redirectTo: '' },
];
