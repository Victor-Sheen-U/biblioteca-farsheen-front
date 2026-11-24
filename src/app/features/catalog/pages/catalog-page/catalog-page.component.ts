import {
  Component,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LibroCatalogo } from '../../../../core/models/libro.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AutorConConteo, CatalogoService } from '../../../../core/services/catalogo.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { buscarLibrosConPuntaje } from '../../../../core/utils/busqueda-difusa';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { BookGridComponent } from '../../../../shared/ui/organisms/book-grid/book-grid.component';

export type OrdenCatalogo = 'relevancia' | 'titulo-asc' | 'titulo-desc' | 'anio-desc' | 'anio-asc';

export interface ChipFiltroActivo {
  readonly id: string;
  readonly etiqueta: string;
  readonly accionRemover: () => void;
}

const TAMANO_PAGINA = 12;

function parsearListaEnteros(raw: string | undefined): number[] {
  if (!raw || typeof raw !== 'string') {
    return [];
  }
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  );
}

function parsearAnio(raw: string | undefined): number | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isInteger(n) || n < 1 || n > 2100) {
    return null;
  }
  return n;
}

function parsearPagina(raw: string | undefined): number {
  if (!raw || typeof raw !== 'string') {
    return 1;
  }
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function parsearOrden(raw: string | undefined, tieneBusqueda: boolean): OrdenCatalogo {
  const validos: readonly OrdenCatalogo[] = [
    'relevancia',
    'titulo-asc',
    'titulo-desc',
    'anio-desc',
    'anio-asc',
  ];
  if (raw && (validos as readonly string[]).includes(raw)) {
    if (raw === 'relevancia' && !tieneBusqueda) {
      return 'titulo-asc';
    }
    return raw as OrdenCatalogo;
  }
  return tieneBusqueda ? 'relevancia' : 'titulo-asc';
}

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [FormsModule, ButtonComponent, IconComponent, BookGridComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent implements OnInit {
  readonly catalogoService = inject(CatalogoService);
  readonly uiState = inject(UiStateService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  /** Query params enlazados desde la URL con withComponentInputBinding() */
  readonly q = input<string | undefined>(undefined);
  readonly generos = input<string | undefined>(undefined);
  readonly autores = input<string | undefined>(undefined);
  readonly desde = input<string | undefined>(undefined);
  readonly hasta = input<string | undefined>(undefined);
  readonly disp = input<string | undefined>(undefined);
  readonly orden = input<string | undefined>(undefined);
  readonly page = input<string | undefined>(undefined);

  readonly tamanoPagina = TAMANO_PAGINA;
  readonly filtroInternoAutor = signal<string>('');
  readonly consultaLocal = signal<string>('');

  readonly consultaActiva = computed<string>(() => (this.q() ?? '').trim());
  readonly generosSeleccionados = computed<readonly number[]>(() =>
    parsearListaEnteros(this.generos()),
  );
  readonly autoresSeleccionados = computed<readonly number[]>(() =>
    parsearListaEnteros(this.autores()),
  );
  readonly anioDesde = computed<number | null>(() => parsearAnio(this.desde()));
  readonly anioHasta = computed<number | null>(() => parsearAnio(this.hasta()));
  readonly soloDisponibles = computed<boolean>(() => this.disp() === '1' || this.disp() === 'true');
  readonly ordenActivo = computed<OrdenCatalogo>(() =>
    parsearOrden(this.orden(), this.consultaActiva().length > 0),
  );

  readonly rangoAniosActivo = computed<boolean>(
    () => this.anioDesde() !== null || this.anioHasta() !== null,
  );

  readonly autoresFiltradosSidebar = computed<readonly AutorConConteo[]>(() => {
    const busq = this.filtroInternoAutor().trim().toLowerCase();
    const todos = this.catalogoService.autoresConConteo();
    if (!busq) {
      return todos;
    }
    return todos.filter((a) => a.nombreAutor.toLowerCase().includes(busq));
  });

  readonly librosFiltrados = computed<readonly LibroCatalogo[]>(() => {
    const base = this.catalogoService.libros();
    const query = this.consultaActiva();

    const conPuntaje = buscarLibrosConPuntaje(base, query);

    const genIds = this.generosSeleccionados();
    const autIds = this.autoresSeleccionados();
    const desdeVal = this.anioDesde();
    const hastaVal = this.anioHasta();
    const dispActivo = this.soloDisponibles();

    const filtrados = conPuntaje.filter(({ libro }) => {
      if (dispActivo && libro.ejemplaresDisponibles <= 0) {
        return false;
      }
      if (genIds.length > 0 && !genIds.includes(libro.idGenero)) {
        return false;
      }
      if (autIds.length > 0 && !libro.autores.some((autor) => autIds.includes(autor.idAutor))) {
        return false;
      }
      if (desdeVal !== null || hastaVal !== null) {
        if (libro.anioPublicacion === null || libro.anioPublicacion === undefined) {
          return false;
        }
        if (desdeVal !== null && libro.anioPublicacion < desdeVal) {
          return false;
        }
        if (hastaVal !== null && libro.anioPublicacion > hastaVal) {
          return false;
        }
      }
      return true;
    });

    const criterio = this.ordenActivo();
    const copia = [...filtrados];

    copia.sort((a, b) => {
      switch (criterio) {
        case 'relevancia':
          if (b.puntaje !== a.puntaje) {
            return b.puntaje - a.puntaje;
          }
          return a.libro.titulo.localeCompare(b.libro.titulo, 'es');
        case 'titulo-desc':
          return b.libro.titulo.localeCompare(a.libro.titulo, 'es');
        case 'anio-desc': {
          const anioA = a.libro.anioPublicacion ?? -Infinity;
          const anioB = b.libro.anioPublicacion ?? -Infinity;
          if (anioB !== anioA) return anioB - anioA;
          return a.libro.titulo.localeCompare(b.libro.titulo, 'es');
        }
        case 'anio-asc': {
          const anioA = a.libro.anioPublicacion ?? Infinity;
          const anioB = b.libro.anioPublicacion ?? Infinity;
          if (anioA !== anioB) return anioA - anioB;
          return a.libro.titulo.localeCompare(b.libro.titulo, 'es');
        }
        case 'titulo-asc':
        default:
          return a.libro.titulo.localeCompare(b.libro.titulo, 'es');
      }
    });

    return copia.map((item) => item.libro);
  });

  readonly totalPaginas = computed<number>(() =>
    Math.max(1, Math.ceil(this.librosFiltrados().length / TAMANO_PAGINA)),
  );

  readonly paginaActual = computed<number>(() => {
    const solicitada = parsearPagina(this.page());
    return Math.min(solicitada, this.totalPaginas());
  });

  readonly librosPaginados = computed<readonly LibroCatalogo[]>(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return this.librosFiltrados().slice(inicio, inicio + TAMANO_PAGINA);
  });

  readonly chipsActivos = computed<readonly ChipFiltroActivo[]>(() => {
    const chips: ChipFiltroActivo[] = [];

    if (this.consultaActiva()) {
      chips.push({
        id: 'q',
        etiqueta: `Búsqueda: «${this.consultaActiva()}»`,
        accionRemover: () => this.actualizarParametros({ q: null, page: null }),
      });
    }

    if (this.soloDisponibles()) {
      chips.push({
        id: 'disp',
        etiqueta: 'Disponibles ahora',
        accionRemover: () => this.actualizarParametros({ disp: null, page: null }),
      });
    }

    const mapaGeneros = new Map(
      this.catalogoService.generosConConteo().map((g) => [g.idGenero, g.nombreGenero]),
    );
    for (const idGen of this.generosSeleccionados()) {
      const nombre = mapaGeneros.get(idGen) ?? `Género #${idGen}`;
      chips.push({
        id: `gen-${idGen}`,
        etiqueta: `Género: ${nombre}`,
        accionRemover: () => this.alternarGenero(idGen),
      });
    }

    const mapaAutores = new Map(
      this.catalogoService.autoresConConteo().map((a) => [a.idAutor, a.nombreAutor]),
    );
    for (const idAut of this.autoresSeleccionados()) {
      const nombre = mapaAutores.get(idAut) ?? `Autor #${idAut}`;
      chips.push({
        id: `aut-${idAut}`,
        etiqueta: `Autor: ${nombre}`,
        accionRemover: () => this.alternarAutor(idAut),
      });
    }

    if (this.anioDesde() !== null || this.anioHasta() !== null) {
      const d = this.anioDesde() ?? '…';
      const h = this.anioHasta() ?? '…';
      chips.push({
        id: 'anios',
        etiqueta: `Año: ${d} – ${h}`,
        accionRemover: () => this.actualizarParametros({ desde: null, hasta: null, page: null }),
      });
    }

    return chips;
  });

  constructor() {
    effect(() => {
      this.consultaLocal.set(this.consultaActiva());
    });
  }

  ngOnInit(): void {
    this.catalogoService.cargarSiNecesario();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (
      typeof window !== 'undefined' &&
      window.innerWidth < 1024 &&
      this.uiState.sidebarCatalogoAbierto()
    ) {
      this.uiState.establecerSidebarCatalogo(false);
    }
  }

  onCambioBusquedaSidebar(valor: string): void {
    this.consultaLocal.set(valor);
    const limpio = valor.trim();
    this.actualizarParametros({ q: limpio || null, page: null });
  }

  alternarSoloDisponibles(checked: boolean): void {
    this.actualizarParametros({ disp: checked ? '1' : null, page: null });
  }

  alternarGenero(idGenero: number): void {
    const actuales = this.generosSeleccionados();
    const nuevos = actuales.includes(idGenero)
      ? actuales.filter((id) => id !== idGenero)
      : [...actuales, idGenero];
    this.actualizarParametros({
      generos: nuevos.length > 0 ? nuevos.join(',') : null,
      page: null,
    });
  }

  alternarAutor(idAutor: number): void {
    const actuales = this.autoresSeleccionados();
    const nuevos = actuales.includes(idAutor)
      ? actuales.filter((id) => id !== idAutor)
      : [...actuales, idAutor];
    this.actualizarParametros({
      autores: nuevos.length > 0 ? nuevos.join(',') : null,
      page: null,
    });
  }

  onCambioAnioDesde(valor: string): void {
    const parsed = parsearAnio(valor);
    this.actualizarParametros({ desde: parsed !== null ? String(parsed) : null, page: null });
  }

  onCambioAnioHasta(valor: string): void {
    const parsed = parsearAnio(valor);
    this.actualizarParametros({ hasta: parsed !== null ? String(parsed) : null, page: null });
  }

  onCambioOrden(nuevoOrden: OrdenCatalogo): void {
    this.actualizarParametros({
      orden: nuevoOrden === 'titulo-asc' && !this.consultaActiva() ? null : nuevoOrden,
      page: null,
    });
  }

  irAPagina(pagina: number): void {
    const valida = Math.max(1, Math.min(pagina, this.totalPaginas()));
    this.actualizarParametros({ page: valida === 1 ? null : String(valida) });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  limpiarTodosLosFiltros(): void {
    this.filtroInternoAutor.set('');
    void this.router.navigate(['/catalog'], {
      queryParams: {},
    });
  }

  onVerDetalle(idLibro: number): void {
    void this.router.navigate(['/catalog', idLibro]);
  }

  onReservar(libro: LibroCatalogo): void {
    if (!this.authService.verificarSesionActiva()) {
      this.notifications.show('Inicia sesión para reservar este libro.', 'info');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/catalog/${libro.idLibro}` },
      });
      return;
    }
    this.uiState.abrirModalReserva(libro);
  }

  private actualizarParametros(cambios: Record<string, string | null>): void {
    void this.router.navigate(['/catalog'], {
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
