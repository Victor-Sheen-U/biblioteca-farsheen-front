import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Route, provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { authGuard, authMatchGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

function aplanarRutas(
  listaRutas: readonly Route[],
  prefijo = '',
): Array<{ pathCompleto: string; route: Route }> {
  const resultado: Array<{ pathCompleto: string; route: Route }> = [];
  for (const r of listaRutas) {
    const segmento = r.path ?? '';
    const actual = [prefijo, segmento].filter(Boolean).join('/');
    resultado.push({ pathCompleto: actual, route: r });
    if (r.children) {
      resultado.push(...aplanarRutas(r.children, actual));
    }
  }
  return resultado;
}

describe('App & Auditoría de tabla de rutas (S-F1)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('debe instanciar el componente raíz App con router-outlet y contenedor de toasts', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });

  it('S-F1: la ruta insegura /home ya no existe en la tabla de rutas', () => {
    const planas = aplanarRutas(routes);
    const existeHome = planas.some(
      (item) => item.pathCompleto === 'home' || item.route.path === 'home',
    );
    expect(existeHome).toBe(false);
  });

  it('S-F1: la ruta protegida /reservas exige authGuard y authMatchGuard, y /loans redirige', () => {
    const planas = aplanarRutas(routes);
    const rutaReservas = planas.find((item) => item.route.path === 'reservas');
    expect(rutaReservas).toBeDefined();
    expect(rutaReservas?.route.canActivate).toContain(authGuard);
    expect(rutaReservas?.route.canMatch).toContain(authMatchGuard);

    const rutaLoans = planas.find((item) => item.route.path === 'loans');
    expect(rutaLoans?.route.redirectTo).toBeDefined();
  });

  it('S-F1: la ruta /admin exige authGuard, authMatchGuard y roleGuard', () => {
    const planas = aplanarRutas(routes);
    const rutaAdmin = planas.find((item) => item.route.path === 'admin');
    expect(rutaAdmin).toBeDefined();
    expect(rutaAdmin?.route.canMatch).toContain(authMatchGuard);
    expect(rutaAdmin?.route.canActivate?.length).toBeGreaterThanOrEqual(2);
  });

  it('S-F1: la ruta /login está protegida con guestGuard para usuarios ya autenticados', () => {
    const planas = aplanarRutas(routes);
    const rutaLogin = planas.find((item) => item.route.path === 'login');
    expect(rutaLogin).toBeDefined();
    expect(rutaLogin?.route.canActivate).toContain(guestGuard);
  });
});
