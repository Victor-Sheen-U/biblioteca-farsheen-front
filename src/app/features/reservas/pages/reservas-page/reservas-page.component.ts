import { DatePipe, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../../core/models/api-error.model';
import { EstadoReserva, Reserva } from '../../../../core/models/reserva.model';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  EvaluacionCancelacion,
  ReservasService,
  puedeCancelarReserva,
} from '../../../../core/services/reservas.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { BadgeComponent, BadgeVariant } from '../../../../shared/ui/atoms/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { StatChipComponent } from '../../../../shared/ui/molecules/stat-chip/stat-chip.component';

export type FiltroEstadoReserva = 'TODAS' | EstadoReserva;
export type OrdenReservas = 'inicio-desc' | 'inicio-asc' | 'entrega-asc' | 'entrega-desc';

@Component({
  selector: 'app-reservas-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, BadgeComponent, ButtonComponent, StatChipComponent],
  templateUrl: './reservas-page.component.html',
  styleUrl: './reservas-page.component.scss',
})
export class ReservasPageComponent implements OnInit {
  readonly reservasService = inject(ReservasService);
  private readonly uiState = inject(UiStateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly vieneDeExpansion = signal<boolean>(false);
  readonly filtroEstado = signal<FiltroEstadoReserva>('TODAS');
  readonly busquedaTitulo = signal<string>('');
  readonly orden = signal<OrdenReservas>('inicio-desc');
  readonly reservaPorCancelar = signal<Reserva | null>(null);
  readonly cancelandoId = signal<number | null>(null);

  /** Búsqueda puntual por ID de reserva (RFN15) */
  readonly idBusqueda = signal<string>('');
  readonly buscandoPorId = signal<boolean>(false);
  readonly resultadoPorId = signal<Reserva | null>(null);
  readonly errorBusquedaId = signal<string | null>(null);

  readonly reservasFiltradas = computed<readonly Reserva[]>(() => {
    const estado = this.filtroEstado();
    const termino = this.busquedaTitulo().trim().toLowerCase();
    const criterioOrden = this.orden();

    const filtradas = this.reservasService.reservas().filter((r) => {
      if (estado !== 'TODAS' && r.estadoReserva !== estado) {
        return false;
      }
      if (
        termino &&
        !r.tituloLibro.toLowerCase().includes(termino) &&
        !String(r.idReserva).includes(termino)
      ) {
        return false;
      }
      return true;
    });

    const copia = [...filtradas];
    copia.sort((a, b) => {
      switch (criterioOrden) {
        case 'inicio-asc':
          return a.fechaInicio.localeCompare(b.fechaInicio);
        case 'entrega-asc':
          return a.fechaEntrega.localeCompare(b.fechaEntrega);
        case 'entrega-desc':
          return b.fechaEntrega.localeCompare(a.fechaEntrega);
        case 'inicio-desc':
        default:
          return b.fechaInicio.localeCompare(a.fechaInicio);
      }
    });

    return copia;
  });

  ngOnInit(): void {
    this.vieneDeExpansion.set(this.uiState.consumirBanderaExpansion());
    this.reservasService.cargarMisReservas();
  }

  buscarReservaPorId(event: Event): void {
    event.preventDefault();
    const idNum = Number.parseInt(this.idBusqueda().trim(), 10);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      this.errorBusquedaId.set('Ingresa un ID de reserva válido.');
      this.resultadoPorId.set(null);
      return;
    }

    this.buscandoPorId.set(true);
    this.errorBusquedaId.set(null);
    this.resultadoPorId.set(null);

    this.reservasService.buscarPorId(idNum).subscribe({
      next: (res) => {
        this.resultadoPorId.set(res);
        this.buscandoPorId.set(false);
      },
      error: (err: Partial<ApiError>) => {
        this.errorBusquedaId.set(err?.mensaje || `No se encontró la reserva #${idNum}.`);
        this.buscandoPorId.set(false);
      },
    });
  }

  limpiarBusquedaId(): void {
    this.idBusqueda.set('');
    this.resultadoPorId.set(null);
    this.errorBusquedaId.set(null);
  }

  evaluarCancelacion(reserva: Reserva): EvaluacionCancelacion {
    return puedeCancelarReserva(reserva);
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

  abrirConfirmacionCancelacion(reserva: Reserva): void {
    this.reservaPorCancelar.set(reserva);
  }

  cerrarConfirmacionCancelacion(): void {
    if (!this.cancelandoId()) {
      this.reservaPorCancelar.set(null);
    }
  }

  confirmarCancelacion(): void {
    const objetivo = this.reservaPorCancelar();
    if (!objetivo || this.cancelandoId()) {
      return;
    }

    this.cancelandoId.set(objetivo.idReserva);
    this.reservasService.cancelarReserva(objetivo.idReserva).subscribe({
      next: () => {
        this.cancelandoId.set(null);
        this.reservaPorCancelar.set(null);
        this.notifications.show(
          `Reserva #${objetivo.idReserva} cancelada exitosamente.`,
          'success',
        );
      },
      error: (err: Partial<ApiError>) => {
        this.cancelandoId.set(null);
        this.reservaPorCancelar.set(null);
        this.notifications.show(err?.mensaje || 'No se pudo cancelar la reserva.', 'error');
      },
    });
  }

  volver(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/catalog']);
    }
  }
}
