import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import {
  AccesibilidadService,
  AlineacionTextoA11y,
  ContrasteA11y,
  SaturacionA11y,
} from '../../../../core/services/accesibilidad.service';
import { A11yToggleCardComponent } from '../../atoms/a11y-toggle-card/a11y-toggle-card.component';
import { IconComponent } from '../../atoms/icon/icon.component';

const ETIQUETA_CONTRASTE: Record<ContrasteA11y, string> = {
  normal: '',
  'alto-claro': 'Alto claro',
  'alto-oscuro': 'Alto oscuro',
};

const ETIQUETA_ALINEACION: Record<AlineacionTextoA11y, string> = {
  left: '',
  center: 'Centrado',
  right: 'Derecha',
};

const ETIQUETA_SATURACION: Record<SaturacionA11y, string> = {
  normal: '',
  baja: 'Baja',
  alta: 'Alta',
  grises: 'Grises',
};

@Component({
  selector: 'app-accesibilidad-widget',
  standalone: true,
  imports: [A11yToggleCardComponent, IconComponent],
  templateUrl: './accesibilidad-widget.component.html',
  styleUrl: './accesibilidad-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesibilidadWidgetComponent {
  readonly a11y = inject(AccesibilidadService);

  private readonly triggerBtn = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panelEl');

  private estuvoAbierto = false;

  constructor() {
    effect(() => {
      const abierto = this.a11y.panelAbierto();
      if (abierto && !this.estuvoAbierto) {
        this.estuvoAbierto = true;
        queueMicrotask(() => this.closeBtn()?.nativeElement.focus());
      } else if (!abierto && this.estuvoAbierto) {
        this.estuvoAbierto = false;
        queueMicrotask(() => {
          const btn = this.triggerBtn()?.nativeElement;
          if (btn && !this.a11y.preferencias().widgetOculto) {
            btn.focus();
          }
        });
      }
    });
  }

  etiquetaContraste(): string {
    return ETIQUETA_CONTRASTE[this.a11y.preferencias().contraste];
  }

  etiquetaTamano(): string {
    const t = this.a11y.preferencias().tamanoTexto;
    return t === 100 ? '' : `${t}%`;
  }

  etiquetaAltura(): string {
    const h = this.a11y.preferencias().alturaLinea;
    return h === 1.5 ? '' : `${h}`;
  }

  etiquetaAlineacion(): string {
    return ETIQUETA_ALINEACION[this.a11y.preferencias().alineacionTexto];
  }

  etiquetaSaturacion(): string {
    return ETIQUETA_SATURACION[this.a11y.preferencias().saturacion];
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'u') {
      event.preventDefault();
      this.a11y.alternarPanel();
      return;
    }

    if (event.key === 'Escape' && this.a11y.panelAbierto()) {
      event.preventDefault();
      this.a11y.cerrarPanel();
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.a11y.panelAbierto()) {
      return;
    }

    const panel = this.panelEl()?.nativeElement;
    if (!panel) {
      return;
    }

    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);

    if (focusables.length === 0) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }
}
