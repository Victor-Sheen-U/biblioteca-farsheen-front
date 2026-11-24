import { Location } from '@angular/common';
import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../../core/models/api-error.model';
import { Disponibilidad, LibroCatalogo } from '../../../../core/models/libro.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReservasService } from '../../../../core/services/reservas.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { generarEstiloPortada } from '../../../../core/utils/portada';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import {
  formatearFechaIsoLocal,
  normalizarDatetimeLocalAIso,
} from '../../../../shared/ui/organisms/reserva-dialog/reserva-dialog.component';

@Component({
  selector: 'app-book-detail-page',
  standalone: true,
  imports: [RouterLink, FormsModule, BadgeComponent, ButtonComponent, IconComponent],
  templateUrl: './book-detail-page.component.html',
  styleUrl: './book-detail-page.component.scss',
})
export class BookDetailPageComponent {
  private readonly catalogoService = inject(CatalogoService);
  private readonly reservasService = inject(ReservasService);
  readonly authService = inject(AuthService);
  private readonly uiState = inject(UiStateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input.required<number, unknown>({ transform: numberAttribute });

  readonly libroRemoto = signal<LibroCatalogo | null>(null);
  readonly cargando = signal<boolean>(true);
  readonly noEncontrado = signal<boolean>(false);

  readonly fechaConsulta = signal<string>(this.fechaPorDefectoInput());
  readonly consultandoDisp = signal<boolean>(false);
  readonly disponibilidadFecha = signal<Disponibilidad | null>(null);
  readonly errorDisp = signal<string | null>(null);

  readonly libro = computed<LibroCatalogo | null>(() => {
    const idActual = this.id();
    if (Number.isNaN(idActual) || idActual <= 0) {
      return null;
    }
    const enLista = this.catalogoService.libros().find((item) => item.idLibro === idActual);
    return this.libroRemoto() ?? enLista ?? null;
  });

  readonly portada = computed(() => {
    const l = this.libro();
    if (!l) {
      return generarEstiloPortada(1, 'BF');
    }
    return generarEstiloPortada(l.idGenero, l.titulo);
  });

  readonly nombresAutores = computed<string>(() => {
    const l = this.libro();
    if (!l || l.autores.length === 0) {
      return 'Autor no registrado';
    }
    return l.autores.map((a) => a.nombreAutor).join(', ');
  });

  constructor() {
    effect(() => {
      const idLibro = this.id();
      this.disponibilidadFecha.set(null);
      this.errorDisp.set(null);

      if (Number.isNaN(idLibro) || idLibro <= 0) {
        this.cargando.set(false);
        this.noEncontrado.set(true);
        this.libroRemoto.set(null);
        return;
      }

      this.cargando.set(true);
      this.noEncontrado.set(false);

      this.catalogoService.obtenerPorId(idLibro).subscribe({
        next: (data) => {
          this.libroRemoto.set(data);
          this.cargando.set(false);
          this.noEncontrado.set(false);
        },
        error: () => {
          this.libroRemoto.set(null);
          this.cargando.set(false);
          this.noEncontrado.set(true);
        },
      });
    });
  }

  onConsultarDisponibilidad(): void {
    const actual = this.libro();
    if (!actual) return;

    if (!this.authService.verificarSesionActiva()) {
      this.notifications.show('Inicia sesión para consultar disponibilidad por fecha.', 'info');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/catalog/${actual.idLibro}` },
      });
      return;
    }

    const iso = normalizarDatetimeLocalAIso(this.fechaConsulta());
    if (!iso) {
      this.errorDisp.set('Selecciona una fecha y hora válida.');
      return;
    }

    this.consultandoDisp.set(true);
    this.errorDisp.set(null);

    this.reservasService.consultarDisponibilidad(actual.idLibro, iso).subscribe({
      next: (res) => {
        this.disponibilidadFecha.set(res);
        this.consultandoDisp.set(false);
      },
      error: (err: Partial<ApiError>) => {
        this.disponibilidadFecha.set(null);
        this.errorDisp.set(err?.mensaje || 'No se pudo consultar la disponibilidad.');
        this.consultandoDisp.set(false);
      },
    });
  }

  onReservar(): void {
    const actual = this.libro();
    if (!actual) {
      return;
    }

    if (!this.authService.verificarSesionActiva()) {
      this.notifications.show('Inicia sesión para reservar un ejemplar de este libro.', 'info');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/catalog/${actual.idLibro}` },
      });
      return;
    }

    this.uiState.abrirModalReserva(actual);
  }

  volverAlCatalogo(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/catalog']);
    }
  }

  private fechaPorDefectoInput(): string {
    const d = new Date(Date.now() + 26 * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return formatearFechaIsoLocal(d).slice(0, 16);
  }
}
