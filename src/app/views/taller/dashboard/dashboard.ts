import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TallerService } from '../../../services/taller.service';
import { SidebarService } from '../../../services/sidebar.service';
import { ModalCrearTaller } from '../../../components/modal-crear-taller/modal-crear-taller';
import { Sidebar } from '../../../components/sidebar/sidebar';

interface Notificacion {
  id: number;
  cliente: string;
  vehiculo: string;
  tipo: string;
  descripcion: string;
  estado: 'pendiente' | 'en_proceso' | 'completado';
  created_at: string;
}

interface Estadisticas {
  total_solicitudes: number;
  solicitudes_pendientes: number;
  solicitudes_completadas: number;
  tecnicos_activos: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ModalCrearTaller, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  authService = inject(AuthService);
  tallerService = inject(TallerService);
  sidebarService = inject(SidebarService);

  user = this.authService.user;
  taller = this.tallerService.taller;
  showModal = this.tallerService.showModal;
  collapsed = this.sidebarService.collapsed;

  estadisticas = signal<Estadisticas>({
    total_solicitudes: 24,
    solicitudes_pendientes: 5,
    solicitudes_completadas: 19,
    tecnicos_activos: 3,
  });

  notificaciones = signal<Notificacion[]>([
    {
      id: 1,
      cliente: 'Carlos Mendoza',
      vehiculo: 'Toyota Corolla - ABC-1234',
      tipo: 'Emergencia',
      descripcion: 'Vehículo no enciende',
      estado: 'pendiente',
      created_at: '2024-01-15T10:30:00',
    },
    {
      id: 2,
      cliente: 'Maria García',
      vehiculo: 'Honda Civic - XYZ-5678',
      tipo: 'Mantenimiento',
      descripcion: 'Cambio de aceite y filtro',
      estado: 'en_proceso',
      created_at: '2024-01-15T09:15:00',
    },
    {
      id: 3,
      cliente: 'Pedro López',
      vehiculo: 'Nissan Sentra - DEF-9012',
      tipo: 'Reparación',
      descripcion: 'Frenos desgastados',
      estado: 'completado',
      created_at: '2024-01-14T16:45:00',
    },
  ]);

  loading = signal(true);

  ngOnInit() {
    this.tallerService.checkMiTaller().subscribe(() => {
      this.loading.set(false);
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'completado':
        return 'Completado';
      default:
        return estado;
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
