import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TallerService } from '../../../../services/taller.service';

@Component({
  selector: 'app-reporte-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-pagos.component.html',
  styleUrl: './reporte-pagos.component.css',
})
export class ReportePagosComponent {
  tallerService = inject(TallerService);

  fechaDesde = signal('');
  fechaHasta = signal('');
  loading = signal(false);
  error = signal('');

  generarReporte() {
    const taller = this.tallerService.taller();
    if (!taller?.id) {
      this.error.set('No se encontró información del taller');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.tallerService
      .generarReportePagos(taller.id, this.fechaDesde(), this.fechaHasta())
      .subscribe({
        next: (blob: Blob) => {
          this.descargarPDF(blob);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error al generar reporte:', err);
          this.error.set('Error al generar el reporte. Intente nuevamente.');
          this.loading.set(false);
        },
      });
  }

  private descargarPDF(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fecha = new Date().toISOString().split('T')[0];
    link.download = `reporte_pagos_${fecha}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
