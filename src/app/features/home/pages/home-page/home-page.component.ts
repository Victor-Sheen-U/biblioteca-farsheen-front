import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LibroCatalogo } from '../../../../core/models/libro.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReservasService } from '../../../../core/services/reservas.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { StatChipComponent } from '../../../../shared/ui/molecules/stat-chip/stat-chip.component';
import { BookGridComponent } from '../../../../shared/ui/organisms/book-grid/book-grid.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ButtonComponent,
    IconComponent,
    StatChipComponent,
    BookGridComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly catalogoService = inject(CatalogoService);
  readonly reservasService = inject(ReservasService);
  private readonly uiState = inject(UiStateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly terminoHero = signal<string>('');

  /** Últimos libros ingresados en el catálogo real (ordenados por idLibro desc) */
  readonly novedades = computed<readonly LibroCatalogo[]>(() =>
    [...this.catalogoService.libros()].sort((a, b) => b.idLibro - a.idLibro).slice(0, 8),
  );

  ngOnInit(): void {
    this.catalogoService.cargarSiNecesario();
  }

  onBuscarHero(event: Event): void {
    event.preventDefault();
    const q = this.terminoHero().trim();
    void this.router.navigate(['/catalog'], {
      queryParams: q ? { q } : undefined,
    });
  }

  onExplorarGenero(idGenero: number): void {
    void this.router.navigate(['/catalog'], {
      queryParams: { generos: String(idGenero) },
    });
  }

  onVerDetalleLibro(idLibro: number): void {
    void this.router.navigate(['/catalog', idLibro]);
  }

  onReservar(libro: LibroCatalogo): void {
    if (!this.authService.verificarSesionActiva()) {
      this.notifications.show('Inicia sesión o crea tu cuenta para reservar este libro.', 'info');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/catalog/${libro.idLibro}` },
      });
      return;
    }

    this.uiState.abrirModalReserva(libro);
  }

  irACatalogoCompleto(): void {
    void this.router.navigate(['/catalog']);
  }
}
