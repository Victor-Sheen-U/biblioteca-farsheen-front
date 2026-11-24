import { Service, computed, effect, signal } from '@angular/core';

export const A11Y_STORAGE_KEY = 'biblio.a11y';

export type ContrasteA11y = 'normal' | 'alto-claro' | 'alto-oscuro';
export type TamanoTextoA11y = 100 | 115 | 130 | 150;
export type AlturaLineaA11y = 1.5 | 1.8 | 2.2;
export type AlineacionTextoA11y = 'left' | 'center' | 'right';
export type SaturacionA11y = 'normal' | 'baja' | 'alta' | 'grises';
export type PosicionWidgetA11y = 'left' | 'right';

export interface PreferenciasA11y {
  readonly contraste: ContrasteA11y;
  readonly resaltarEnlaces: boolean;
  readonly tamanoTexto: TamanoTextoA11y;
  readonly espaciadoTexto: boolean;
  readonly alturaLinea: AlturaLineaA11y;
  readonly alineacionTexto: AlineacionTextoA11y;
  readonly fuenteDislexia: boolean;
  readonly detenerAnimaciones: boolean;
  readonly ocultarImagenes: boolean;
  readonly cursorGrande: boolean;
  readonly saturacion: SaturacionA11y;
  readonly posicionWidget: PosicionWidgetA11y;
  readonly widgetOculto: boolean;
}

const CONTRASTES_VALIDOS: readonly ContrasteA11y[] = ['normal', 'alto-claro', 'alto-oscuro'];
const TAMANOS_VALIDOS: readonly TamanoTextoA11y[] = [100, 115, 130, 150];
const ALTURAS_VALIDAS: readonly AlturaLineaA11y[] = [1.5, 1.8, 2.2];
const ALINEACIONES_VALIDAS: readonly AlineacionTextoA11y[] = ['left', 'center', 'right'];
const SATURACIONES_VALIDAS: readonly SaturacionA11y[] = ['normal', 'baja', 'alta', 'grises'];
const POSICIONES_VALIDAS: readonly PosicionWidgetA11y[] = ['left', 'right'];

function detectarPrefersReducedMotion(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function crearDefaultsA11y(): PreferenciasA11y {
  return {
    contraste: 'normal',
    resaltarEnlaces: false,
    tamanoTexto: 100,
    espaciadoTexto: false,
    alturaLinea: 1.5,
    alineacionTexto: 'left',
    fuenteDislexia: false,
    detenerAnimaciones: detectarPrefersReducedMotion(),
    ocultarImagenes: false,
    cursorGrande: false,
    saturacion: 'normal',
    posicionWidget: 'left',
    widgetOculto: false,
  };
}

@Service()
export class AccesibilidadService {
  private readonly _preferencias = signal<PreferenciasA11y>(this.cargarDesdeStorage());
  private readonly _panelAbierto = signal<boolean>(false);
  private readonly _ultimoAnuncio = signal<string>('');

  readonly preferencias = this._preferencias.asReadonly();
  readonly panelAbierto = this._panelAbierto.asReadonly();
  readonly ultimoAnuncio = this._ultimoAnuncio.asReadonly();

  readonly conteoActivas = computed<number>(() => {
    const p = this._preferencias();
    let total = 0;
    if (p.contraste !== 'normal') total += 1;
    if (p.resaltarEnlaces) total += 1;
    if (p.tamanoTexto !== 100) total += 1;
    if (p.espaciadoTexto) total += 1;
    if (p.alturaLinea !== 1.5) total += 1;
    if (p.alineacionTexto !== 'left') total += 1;
    if (p.fuenteDislexia) total += 1;
    if (p.detenerAnimaciones) total += 1;
    if (p.ocultarImagenes) total += 1;
    if (p.cursorGrande) total += 1;
    if (p.saturacion !== 'normal') total += 1;
    return total;
  });

  constructor() {
    effect(() => {
      const prefs = this._preferencias();
      this.aplicarAlDom(prefs);
      this.guardarEnStorage(prefs);
    });
  }

  abrirPanel(): void {
    this._panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this._panelAbierto.set(false);
  }

  alternarPanel(): void {
    this._panelAbierto.update((v) => !v);
  }

  /** A1: Ciclo normal -> alto-claro -> alto-oscuro */
  ciclarContraste(): void {
    this.actualizar((p) => {
      const idx = CONTRASTES_VALIDOS.indexOf(p.contraste);
      const siguiente = CONTRASTES_VALIDOS[(idx + 1) % CONTRASTES_VALIDOS.length];
      return { ...p, contraste: siguiente };
    }, 'Contraste');
  }

  /** A2: Resaltar enlaces */
  alternarResaltarEnlaces(): void {
    this.actualizar((p) => ({ ...p, resaltarEnlaces: !p.resaltarEnlaces }), 'Resaltar enlaces');
  }

  /** A3: Agrandar texto 100 -> 115 -> 130 -> 150 % */
  ciclarTamanoTexto(): void {
    this.actualizar((p) => {
      const idx = TAMANOS_VALIDOS.indexOf(p.tamanoTexto);
      const siguiente = TAMANOS_VALIDOS[(idx + 1) % TAMANOS_VALIDOS.length];
      return { ...p, tamanoTexto: siguiente };
    }, 'Tamaño de texto');
  }

  /** A4: Espaciado de texto WCAG 1.4.12 */
  alternarEspaciadoTexto(): void {
    this.actualizar((p) => ({ ...p, espaciadoTexto: !p.espaciadoTexto }), 'Espaciado de texto');
  }

  /** A5: Altura de línea 1.5 -> 1.8 -> 2.2 */
  ciclarAlturaLinea(): void {
    this.actualizar((p) => {
      const idx = ALTURAS_VALIDAS.indexOf(p.alturaLinea);
      const siguiente = ALTURAS_VALIDAS[(idx + 1) % ALTURAS_VALIDAS.length];
      return { ...p, alturaLinea: siguiente };
    }, 'Altura de línea');
  }

  /** A6: Alineación de texto izquierda -> centro -> derecha */
  ciclarAlineacionTexto(): void {
    this.actualizar((p) => {
      const idx = ALINEACIONES_VALIDAS.indexOf(p.alineacionTexto);
      const siguiente = ALINEACIONES_VALIDAS[(idx + 1) % ALINEACIONES_VALIDAS.length];
      return { ...p, alineacionTexto: siguiente };
    }, 'Alineación de texto');
  }

  /** A7: Fuente apta para dislexia */
  alternarFuenteDislexia(): void {
    this.actualizar((p) => ({ ...p, fuenteDislexia: !p.fuenteDislexia }), 'Fuente para dislexia');
  }

  /** A8: Detener animaciones */
  alternarDetenerAnimaciones(): void {
    this.actualizar(
      (p) => ({ ...p, detenerAnimaciones: !p.detenerAnimaciones }),
      'Detener animaciones',
    );
  }

  /** A9: Ocultar imágenes y portadas decorativas */
  alternarOcultarImagenes(): void {
    this.actualizar((p) => ({ ...p, ocultarImagenes: !p.ocultarImagenes }), 'Ocultar imágenes');
  }

  /** A10: Cursor grande */
  alternarCursorGrande(): void {
    this.actualizar((p) => ({ ...p, cursorGrande: !p.cursorGrande }), 'Cursor grande');
  }

  /** A11: Saturación normal -> baja -> alta -> grises */
  ciclarSaturacion(): void {
    this.actualizar((p) => {
      const idx = SATURACIONES_VALIDAS.indexOf(p.saturacion);
      const siguiente = SATURACIONES_VALIDAS[(idx + 1) % SATURACIONES_VALIDAS.length];
      return { ...p, saturacion: siguiente };
    }, 'Saturación');
  }

  /** A12: Restablecer todas las configuraciones */
  restablecerTodo(): void {
    const base: PreferenciasA11y = {
      ...crearDefaultsA11y(),
      detenerAnimaciones: false,
    };
    this._preferencias.set(base);
    this._ultimoAnuncio.set('Configuración de accesibilidad restablecida.');
    try {
      localStorage.removeItem(A11Y_STORAGE_KEY);
    } catch {
      // Ignorar si almacenamiento está restringido
    }
  }

  /** A13: Mover posición izquierda/derecha */
  alternarPosicionWidget(): void {
    this.actualizar(
      (p) => ({ ...p, posicionWidget: p.posicionWidget === 'left' ? 'right' : 'left' }),
      'Posición del widget',
    );
  }

  /** A13: Ocultar o mostrar botón flotante */
  alternarOcultarWidget(): void {
    this.actualizar((p) => ({ ...p, widgetOculto: !p.widgetOculto }), 'Visibilidad del widget');
  }

  mostrarWidget(): void {
    this._preferencias.update((p) => ({ ...p, widgetOculto: false }));
    this._ultimoAnuncio.set('Botón de accesibilidad visible.');
  }

  private actualizar(
    mutador: (actual: PreferenciasA11y) => PreferenciasA11y,
    etiqueta: string,
  ): void {
    this._preferencias.update(mutador);
    this._ultimoAnuncio.set(`${etiqueta} actualizado.`);
  }

  private aplicarAlDom(p: PreferenciasA11y): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;

    root.classList.toggle('a11y-contrast-high', p.contraste === 'alto-claro');
    root.classList.toggle('a11y-contrast-dark', p.contraste === 'alto-oscuro');
    root.classList.toggle('a11y-highlight-links', p.resaltarEnlaces);
    root.classList.toggle('a11y-font-scaled', p.tamanoTexto !== 100);
    if (p.tamanoTexto !== 100) {
      root.style.setProperty('--a11y-font-scale', `${p.tamanoTexto}%`);
    } else {
      root.style.removeProperty('--a11y-font-scale');
    }

    root.classList.toggle('a11y-text-spacing', p.espaciadoTexto);
    root.classList.toggle('a11y-line-height', p.alturaLinea !== 1.5);
    if (p.alturaLinea !== 1.5) {
      root.style.setProperty('--a11y-line-height', String(p.alturaLinea));
    } else {
      root.style.removeProperty('--a11y-line-height');
    }

    root.classList.toggle('a11y-text-aligned', p.alineacionTexto !== 'left');
    if (p.alineacionTexto !== 'left') {
      root.style.setProperty('--a11y-text-align', p.alineacionTexto);
    } else {
      root.style.removeProperty('--a11y-text-align');
    }

    root.classList.toggle('a11y-dyslexia-font', p.fuenteDislexia);
    root.classList.toggle('a11y-no-motion', p.detenerAnimaciones);
    root.classList.toggle('a11y-hide-images', p.ocultarImagenes);
    root.classList.toggle('a11y-large-cursor', p.cursorGrande);

    root.classList.remove('a11y-sat-baja', 'a11y-sat-alta', 'a11y-sat-grises');
    if (p.saturacion !== 'normal') {
      root.classList.add(`a11y-sat-${p.saturacion}`);
    }
  }

  private cargarDesdeStorage(): PreferenciasA11y {
    const defaults = crearDefaultsA11y();
    try {
      const raw = localStorage.getItem(A11Y_STORAGE_KEY);
      if (!raw) {
        return defaults;
      }
      const parsed = JSON.parse(raw) as Partial<PreferenciasA11y>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return defaults;
      }

      return {
        contraste: CONTRASTES_VALIDOS.includes(parsed.contraste as ContrasteA11y)
          ? (parsed.contraste as ContrasteA11y)
          : defaults.contraste,
        resaltarEnlaces:
          typeof parsed.resaltarEnlaces === 'boolean'
            ? parsed.resaltarEnlaces
            : defaults.resaltarEnlaces,
        tamanoTexto: TAMANOS_VALIDOS.includes(parsed.tamanoTexto as TamanoTextoA11y)
          ? (parsed.tamanoTexto as TamanoTextoA11y)
          : defaults.tamanoTexto,
        espaciadoTexto:
          typeof parsed.espaciadoTexto === 'boolean'
            ? parsed.espaciadoTexto
            : defaults.espaciadoTexto,
        alturaLinea: ALTURAS_VALIDAS.includes(parsed.alturaLinea as AlturaLineaA11y)
          ? (parsed.alturaLinea as AlturaLineaA11y)
          : defaults.alturaLinea,
        alineacionTexto: ALINEACIONES_VALIDAS.includes(
          parsed.alineacionTexto as AlineacionTextoA11y,
        )
          ? (parsed.alineacionTexto as AlineacionTextoA11y)
          : defaults.alineacionTexto,
        fuenteDislexia:
          typeof parsed.fuenteDislexia === 'boolean'
            ? parsed.fuenteDislexia
            : defaults.fuenteDislexia,
        detenerAnimaciones:
          typeof parsed.detenerAnimaciones === 'boolean'
            ? parsed.detenerAnimaciones
            : defaults.detenerAnimaciones,
        ocultarImagenes:
          typeof parsed.ocultarImagenes === 'boolean'
            ? parsed.ocultarImagenes
            : defaults.ocultarImagenes,
        cursorGrande:
          typeof parsed.cursorGrande === 'boolean' ? parsed.cursorGrande : defaults.cursorGrande,
        saturacion: SATURACIONES_VALIDAS.includes(parsed.saturacion as SaturacionA11y)
          ? (parsed.saturacion as SaturacionA11y)
          : defaults.saturacion,
        posicionWidget: POSICIONES_VALIDAS.includes(parsed.posicionWidget as PosicionWidgetA11y)
          ? (parsed.posicionWidget as PosicionWidgetA11y)
          : defaults.posicionWidget,
        widgetOculto:
          typeof parsed.widgetOculto === 'boolean' ? parsed.widgetOculto : defaults.widgetOculto,
      };
    } catch {
      return defaults;
    }
  }

  private guardarEnStorage(prefs: PreferenciasA11y): void {
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignorar si almacenamiento está restringido
    }
  }
}
