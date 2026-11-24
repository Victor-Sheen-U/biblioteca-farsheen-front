import { TestBed } from '@angular/core/testing';
import { A11Y_STORAGE_KEY, AccesibilidadService } from './accesibilidad.service';

const CLASES_A11Y = [
  'a11y-contrast-high',
  'a11y-contrast-dark',
  'a11y-highlight-links',
  'a11y-font-scaled',
  'a11y-text-spacing',
  'a11y-line-height',
  'a11y-text-aligned',
  'a11y-dyslexia-font',
  'a11y-no-motion',
  'a11y-hide-images',
  'a11y-large-cursor',
  'a11y-sat-baja',
  'a11y-sat-alta',
  'a11y-sat-grises',
];

function limpiarDomYStorage(): void {
  localStorage.clear();
  const root = document.documentElement;
  root.classList.remove(...CLASES_A11Y);
  root.style.removeProperty('--a11y-font-scale');
  root.style.removeProperty('--a11y-line-height');
  root.style.removeProperty('--a11y-text-align');
}

describe('AccesibilidadService — Funciones A1–A13 y persistencia', () => {
  beforeEach(limpiarDomYStorage);
  afterEach(limpiarDomYStorage);

  it('inicia con valores por defecto y conteo 0 (sin preferencias activas)', () => {
    TestBed.configureTestingModule({ providers: [AccesibilidadService] });
    const service = TestBed.inject(AccesibilidadService);

    expect(service.preferencias()).toEqual({
      contraste: 'normal',
      resaltarEnlaces: false,
      tamanoTexto: 100,
      espaciadoTexto: false,
      alturaLinea: 1.5,
      alineacionTexto: 'left',
      fuenteDislexia: false,
      detenerAnimaciones: false,
      ocultarImagenes: false,
      cursorGrande: false,
      saturacion: 'normal',
      posicionWidget: 'left',
      widgetOculto: false,
    });
    expect(service.conteoActivas()).toBe(0);
  });

  it('descarta JSON corrupto, arrays o valores fuera de lista cerrada al leer biblio.a11y', () => {
    localStorage.setItem(A11Y_STORAGE_KEY, '{no-es-json');
    TestBed.configureTestingModule({ providers: [AccesibilidadService] });
    const s1 = TestBed.inject(AccesibilidadService);
    expect(s1.preferencias().contraste).toBe('normal');

    TestBed.resetTestingModule();
    localStorage.setItem(
      A11Y_STORAGE_KEY,
      JSON.stringify({
        contraste: 'malicioso<script>',
        tamanoTexto: 999,
        alturaLinea: 9,
        alineacionTexto: 'justify',
        saturacion: 'neon',
        resaltarEnlaces: 'true',
        posicionWidget: 'top',
      }),
    );
    TestBed.configureTestingModule({ providers: [AccesibilidadService] });
    const s2 = TestBed.inject(AccesibilidadService);
    expect(s2.preferencias()).toEqual({
      contraste: 'normal',
      resaltarEnlaces: false,
      tamanoTexto: 100,
      espaciadoTexto: false,
      alturaLinea: 1.5,
      alineacionTexto: 'left',
      fuenteDislexia: false,
      detenerAnimaciones: false,
      ocultarImagenes: false,
      cursorGrande: false,
      saturacion: 'normal',
      posicionWidget: 'left',
      widgetOculto: false,
    });
  });

  it('recorre todos los ciclos A1–A11, aplica clases/variables y persiste en localStorage', () => {
    TestBed.configureTestingModule({ providers: [AccesibilidadService] });
    const service = TestBed.inject(AccesibilidadService);
    const root = document.documentElement;

    // A1 Contraste +
    service.ciclarContraste();
    expect(service.preferencias().contraste).toBe('alto-claro');
    service.ciclarContraste();
    expect(service.preferencias().contraste).toBe('alto-oscuro');
    service.ciclarContraste();
    expect(service.preferencias().contraste).toBe('normal');

    // A2 Enlaces
    service.alternarResaltarEnlaces();
    expect(service.preferencias().resaltarEnlaces).toBe(true);

    // A3 Agrandar texto
    service.ciclarTamanoTexto();
    expect(service.preferencias().tamanoTexto).toBe(115);
    service.ciclarTamanoTexto();
    expect(service.preferencias().tamanoTexto).toBe(130);
    service.ciclarTamanoTexto();
    expect(service.preferencias().tamanoTexto).toBe(150);

    // A4 Espaciado
    service.alternarEspaciadoTexto();
    expect(service.preferencias().espaciadoTexto).toBe(true);

    // A5 Altura de línea
    service.ciclarAlturaLinea();
    expect(service.preferencias().alturaLinea).toBe(1.8);
    service.ciclarAlturaLinea();
    expect(service.preferencias().alturaLinea).toBe(2.2);

    // A6 Alineación
    service.ciclarAlineacionTexto();
    expect(service.preferencias().alineacionTexto).toBe('center');
    service.ciclarAlineacionTexto();
    expect(service.preferencias().alineacionTexto).toBe('right');

    // A7 Dislexia, A8 Animaciones, A9 Imágenes, A10 Cursor
    service.alternarFuenteDislexia();
    service.alternarDetenerAnimaciones();
    service.alternarOcultarImagenes();
    service.alternarCursorGrande();
    expect(service.preferencias().fuenteDislexia).toBe(true);
    expect(service.preferencias().detenerAnimaciones).toBe(true);
    expect(service.preferencias().ocultarImagenes).toBe(true);
    expect(service.preferencias().cursorGrande).toBe(true);

    // A11 Saturación
    service.ciclarSaturacion();
    expect(service.preferencias().saturacion).toBe('baja');
    service.ciclarSaturacion();
    expect(service.preferencias().saturacion).toBe('alta');
    service.ciclarSaturacion();
    expect(service.preferencias().saturacion).toBe('grises');

    TestBed.flushEffects();
    expect(root.classList.contains('a11y-highlight-links')).toBe(true);
    expect(root.style.getPropertyValue('--a11y-font-scale')).toBe('150%');
    expect(root.style.getPropertyValue('--a11y-line-height')).toBe('2.2');
    expect(root.style.getPropertyValue('--a11y-text-align')).toBe('right');
    expect(root.classList.contains('a11y-sat-grises')).toBe(true);

    const guardado = JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) ?? '{}');
    expect(guardado.tamanoTexto).toBe(150);
    expect(guardado.saturacion).toBe('grises');
  });

  it('permite mover/ocultar el widget (A13) y restablecer todo (A12)', () => {
    TestBed.configureTestingModule({ providers: [AccesibilidadService] });
    const service = TestBed.inject(AccesibilidadService);

    service.ciclarContraste();
    service.alternarPosicionWidget();
    service.alternarOcultarWidget();
    TestBed.flushEffects();

    expect(service.preferencias().posicionWidget).toBe('right');
    expect(service.preferencias().widgetOculto).toBe(true);
    expect(service.conteoActivas()).toBe(1);

    service.restablecerTodo();
    TestBed.flushEffects();

    expect(service.preferencias().contraste).toBe('normal');
    expect(service.preferencias().posicionWidget).toBe('left');
    expect(service.preferencias().widgetOculto).toBe(false);
    expect(service.conteoActivas()).toBe(0);
    expect(document.documentElement.classList.contains('a11y-contrast-high')).toBe(false);
  });
});
