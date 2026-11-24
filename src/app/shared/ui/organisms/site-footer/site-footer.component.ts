import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../../../core/config/site.config';
import { Rol } from '../../../../core/models/auth.model';
import { GeneroConConteo } from '../../../../core/services/catalogo.service';
import { BrandComponent } from '../../molecules/brand/brand.component';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, BrandComponent],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly enInicio = input<boolean>(false);
  readonly autenticado = input<boolean>(false);
  readonly rolUsuario = input<Rol | null>(null);
  readonly generos = input<readonly GeneroConConteo[]>([]);

  readonly irInicio = output<void>();
  readonly abrirReservas = output<void>();
  readonly cerrarSesion = output<void>();
  readonly abrirAccesibilidad = output<void>();

  readonly config = SITE_CONFIG;
  readonly anioActual = new Date().getFullYear();

  readonly generosDestacados = computed<readonly GeneroConConteo[]>(() =>
    this.generos().slice(0, 6),
  );
}
