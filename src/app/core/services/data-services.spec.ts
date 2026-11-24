import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService, SESSION_STORAGE_KEY } from './auth.service';
import { crearJwtPrueba } from './auth.service.spec';
import { CatalogoService } from './catalogo.service';
import { ReservasService, puedeCancelarReserva } from './reservas.service';

describe('Servicios de datos: CatalogoService y ReservasService', () => {
  let httpMock: HttpTestingController;
  let catalogoService: CatalogoService;
  let reservasService: ReservasService;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        CatalogoService,
        ReservasService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    catalogoService = TestBed.inject(CatalogoService);
    reservasService = TestBed.inject(ReservasService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('CatalogoService calcula estadísticas reales, géneros, autores y rango de años desde GET /catalogo', () => {
    catalogoService.refrescar();
    const req = httpMock.expectOne(`${environment.apiUrl}/catalogo`);
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        idLibro: 1,
        isbn: '978-1',
        titulo: 'Cien Años de Soledad',
        idGenero: 10,
        nombreGenero: 'Novela',
        autores: [{ idAutor: 100, nombreAutor: 'Gabriel García Márquez' }],
        anioPublicacion: 1967,
        totalEjemplares: 3,
        ejemplaresDisponibles: 2,
      },
      {
        idLibro: 2,
        isbn: '978-2',
        titulo: 'El Amor en los Tiempos del Cólera',
        idGenero: 10,
        nombreGenero: 'Novela',
        autores: [{ idAutor: 100, nombreAutor: 'Gabriel García Márquez' }],
        anioPublicacion: 1985,
        totalEjemplares: 2,
        ejemplaresDisponibles: 0,
      },
    ]);

    expect(catalogoService.estadisticas()).toEqual({
      totalTitulos: 2,
      copiasDisponiblesAhora: 2,
      totalEjemplares: 5,
    });
    expect(catalogoService.generosConConteo()[0].total).toBe(2);
    expect(catalogoService.autoresConConteo()[0].total).toBe(2);
    expect(catalogoService.rangoAnios()).toEqual({ min: 1967, max: 1985, sinAnio: 0 });
    expect(catalogoService.disponiblesAhora().length).toBe(1);
  });

  it('puedeCancelarReserva verifica estrictamente la regla de 24 horas antes de fechaInicio (RFN19)', () => {
    const ahora = new Date('2026-11-20T10:00:00').getTime();

    expect(
      puedeCancelarReserva({ estadoReserva: 'ACTIVA', fechaInicio: '2026-11-21T11:00:00' }, ahora)
        .puede,
    ).toBe(true);

    expect(
      puedeCancelarReserva({ estadoReserva: 'ACTIVA', fechaInicio: '2026-11-21T10:00:00' }, ahora)
        .puede,
    ).toBe(false);

    expect(
      puedeCancelarReserva({ estadoReserva: 'ACTIVA', fechaInicio: '2026-11-20T22:00:00' }, ahora)
        .puede,
    ).toBe(false);

    expect(
      puedeCancelarReserva(
        { estadoReserva: 'CANCELADA', fechaInicio: '2026-11-25T10:00:00' },
        ahora,
      ).puede,
    ).toBe(false);
  });

  it('ReservasService carga mis reservas al autenticarse y consulta reserva por ID (RFN15)', () => {
    const expFuturo = Math.floor((Date.now() + 3_600_000) / 1000);
    const token = crearJwtPrueba({ sub: 'ana@eam.edu.co', rol: 'USUARIO', exp: expFuturo });
    authService.login('ana@eam.edu.co', 'Clave123*').subscribe();

    const reqLogin = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    reqLogin.flush({
      token,
      tipoToken: 'Bearer',
      expiraEnMs: 3_600_000,
      correo: 'ana@eam.edu.co',
      rol: 'USUARIO',
      nombreCompleto: 'Ana',
    });

    TestBed.flushEffects();
    const reqReservas = httpMock.match(`${environment.apiUrl}/reservas/mis-reservas`);
    for (const r of reqReservas) {
      r.flush([]);
    }

    expect(reservasService.conteoActivas()).toBe(0);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeTruthy();

    reservasService.buscarPorId(42).subscribe((res) => {
      expect(res.idReserva).toBe(42);
    });
    const reqById = httpMock.expectOne(`${environment.apiUrl}/reservas/42`);
    expect(reqById.request.method).toBe('GET');
    reqById.flush({
      idReserva: 42,
      idUsuario: 1,
      nombreUsuario: 'Ana',
      idEjemplar: 3,
      idLibro: 1,
      tituloLibro: 'Cien Años de Soledad',
      fechaSolicitud: '2026-11-20T10:00:00',
      fechaInicio: '2026-11-25T10:00:00',
      fechaEntrega: '2026-11-28T10:00:00',
      estadoReserva: 'ACTIVA',
    });
  });
});
