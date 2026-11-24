import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../../../core/models/api-error.model';
import { EstadoReserva, Reserva } from '../../../../core/models/reserva.model';
import { AdminReservasService } from '../../../../core/services/admin-reservas.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BadgeComponent, BadgeVariant } from '../../../../shared/ui/atoms/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';

@Component({
  selector: 'app-admin-reservas-page',
  standalone: true,
  imports: [DatePipe, FormsModule, BadgeComponent, ButtonComponent],
  templateUrl: './admin-reservas-page.component.html',
  styleUrl: '../admin-libros-page/admin-libros-page.component.scss',
})
export class AdminReservasPageComponent implements OnInit {
  private readonly adminReservas = inject(AdminReservasService);
  private readonly notifications = inject(NotificationService);

  readonly reservas = signal<readonly Reserva[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly idUsuarioFiltro = signal<string>('');
  readonly cancelandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarTodas();
  }

  cargarTodas(): void {
    this.idUsuarioFiltro.set('');
    this.cargando.set(true);
    this.error.set(null);
    this.adminReservas.listarTodas().subscribe({
      next: (lista) => {
        this.reservas.set(lista);
        this.cargando.set(false);
      },
      error: (err: Partial<ApiError>) => {
        this.error.set(err?.mensaje || 'No se pudieron cargar las reservas.');
        this.cargando.set(false);
      },
    });
  }

  filtrarPorUsuario(event: Event): void {
    event.preventDefault();
    const idNum = Number.parseInt(this.idUsuarioFiltro().trim(), 10);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      this.cargarTodas();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.adminReservas.listarPorUsuario(idNum).subscribe({
      next: (lista) => {
        this.reservas.set(lista);
        this.cargando.set(false);
      },
      error: (err: Partial<ApiError>) => {
        this.error.set(err?.mensaje || `No se encontraron reservas para el usuario #${idNum}.`);
        this.reservas.set([]);
        this.cargando.set(false);
      },
    });
  }

  cancelarAdmin(idReserva: number): void {
    if (this.cancelandoId()) return;
    this.cancelandoId.set(idReserva);
    this.adminReservas.cancelarComoAdmin(idReserva).subscribe({
      next: (actualizada) => {
        this.reservas.update((prev) =>
          prev.map((r) => (r.idReserva === idReserva ? actualizada : r)),
        );
        this.cancelandoId.set(null);
        this.notifications.show(`Reserva #${idReserva} cancelada por administración.`, 'success');
      },
      error: (err: Partial<ApiError>) => {
        this.cancelandoId.set(null);
        this.notifications.show(err?.mensaje || 'No se pudo cancelar la reserva.', 'error');
      },
    });
  }

  varianteEstado(estado: EstadoReserva): BadgeVariant {
    switch (estado) {
      case 'ACTIVA':
        return 'success';
      case 'FINALIZADA':
        return 'primary';
      case 'CANCELADA':
        return 'neutral';
    }
  }
}
