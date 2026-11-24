import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccesibilidadService } from '../../../../core/services/accesibilidad.service';
import { AccesibilidadWidgetComponent } from './accesibilidad-widget.component';

describe('AccesibilidadWidgetComponent — Interacción, teclado y ARIA', () => {
  let fixture: ComponentFixture<AccesibilidadWidgetComponent>;
  let service: AccesibilidadService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AccesibilidadWidgetComponent],
    }).compileComponents();

    service = TestBed.inject(AccesibilidadService);
    fixture = TestBed.createComponent(AccesibilidadWidgetComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('muestra el botón flotante inicial y abre el panel role="dialog" al hacer clic', () => {
    const fab: HTMLButtonElement | null = fixture.nativeElement.querySelector('.a11y-fab');
    expect(fab).not.toBeNull();

    fab!.click();
    fixture.detectChanges();

    const dialog: HTMLElement | null = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-labelledby')).toBe('a11y-panel-title');
    expect(dialog?.textContent).toContain('Menú de accesibilidad');
  });

  it('actualiza aria-pressed al activar opciones y permite restablecer', () => {
    service.abrirPanel();
    fixture.detectChanges();

    const cards: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.a11y-card');
    expect(cards.length).toBe(11);
    expect(cards[0].getAttribute('aria-pressed')).toBe('false');

    cards[0].click();
    fixture.detectChanges();
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');

    const resetBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.a11y-action-btn--reset');
    resetBtn!.click();
    fixture.detectChanges();
    expect(cards[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('responde a CTRL+U para abrir/cerrar incluso con botón oculto y cierra con Escape', async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'u', ctrlKey: true }));
    fixture.detectChanges();
    expect(service.panelAbierto()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(service.panelAbierto()).toBe(false);

    service.alternarOcultarWidget();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.a11y-fab')).toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'U', ctrlKey: true }));
    fixture.detectChanges();
    expect(service.panelAbierto()).toBe(true);
  });
});
