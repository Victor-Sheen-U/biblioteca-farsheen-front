import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Rol } from '../../../../core/models/auth.model';
import { IconComponent } from '../../atoms/icon/icon.component';
import { ThemeToggleComponent } from '../../atoms/theme-toggle/theme-toggle.component';
import { BrandComponent } from '../../molecules/brand/brand.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    BrandComponent,
    IconComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnDestroy {
  readonly enInicio = input<boolean>(false);
  readonly enCatalogo = input<boolean>(false);
  readonly autenticado = input<boolean>(false);
  readonly nombreUsuario = input<string>('');
  readonly correoUsuario = input<string | null>(null);
  readonly rolUsuario = input<Rol | null>(null);
  readonly reservasActivas = input<number>(0);
  readonly consultaInicial = input<string>('');

  readonly irInicio = output<void>();
  readonly buscar = output<string>();
  readonly cambioBusquedaVivo = output<string>();
  readonly abrirReservas = output<void>();
  readonly cerrarSesion = output<void>();

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  readonly terminoBusqueda = signal<string>('');
  readonly busquedaExpandida = signal<boolean>(false);
  readonly menuUsuarioAbierto = signal<boolean>(false);
  readonly menuMovilAbierto = signal<boolean>(false);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const valorExterno = this.consultaInicial();
      this.terminoBusqueda.set(valorExterno ?? '');
      if (valorExterno) {
        this.busquedaExpandida.set(true);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.menuUsuarioAbierto.set(false);
      this.menuMovilAbierto.set(false);
      this.busquedaExpandida.set(false);
      return;
    }

    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName !== 'input' &&
        tagName !== 'textarea' &&
        tagName !== 'select' &&
        !target?.isContentEditable
      ) {
        event.preventDefault();
        this.abrirBuscador();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    if (this.menuUsuarioAbierto() && !target.closest('.site-header__user-menu')) {
      this.menuUsuarioAbierto.set(false);
    }
    if (
      this.busquedaExpandida() &&
      !this.terminoBusqueda() &&
      !target.closest('.site-header__search-wrap')
    ) {
      this.busquedaExpandida.set(false);
    }
  }

  abrirBuscador(): void {
    this.busquedaExpandida.set(true);
    setTimeout(() => {
      this.searchInputRef?.nativeElement?.focus();
      this.searchInputRef?.nativeElement?.select();
    }, 30);
  }

  alternarBuscador(): void {
    if (this.busquedaExpandida() && !this.terminoBusqueda()) {
      this.busquedaExpandida.set(false);
    } else {
      this.abrirBuscador();
    }
  }

  onInputBusqueda(valor: string): void {
    this.terminoBusqueda.set(valor);
    if (this.enCatalogo()) {
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.cambioBusquedaVivo.emit(this.terminoBusqueda());
      }, 200);
    }
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    if (this.enCatalogo()) {
      this.cambioBusquedaVivo.emit('');
    }
    this.searchInputRef?.nativeElement?.focus();
  }

  onSubmitBusqueda(event: Event): void {
    event.preventDefault();
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.buscar.emit(this.terminoBusqueda().trim());
    this.menuMovilAbierto.set(false);
  }

  onClickMisReservas(): void {
    this.menuMovilAbierto.set(false);
    this.menuUsuarioAbierto.set(false);
    this.abrirReservas.emit();
  }

  alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update((abierto) => !abierto);
  }

  onConfirmarLogout(): void {
    this.menuUsuarioAbierto.set(false);
    this.menuMovilAbierto.set(false);
    this.cerrarSesion.emit();
  }

  obtenerIniciales(): string {
    const nombre = this.nombreUsuario().trim();
    if (!nombre) {
      return 'U';
    }
    const partes = nombre.split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  }
}
