import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Autor,
  Ejemplar,
  Genero,
  Libro,
  LibroCreate,
  LibroDetalle,
  LibroUpdate,
} from '../models/libro.model';
import { CatalogoService } from './catalogo.service';

@Service()
export class AdminLibrosService {
  private readonly http = inject(HttpClient);
  private readonly catalogoService = inject(CatalogoService);
  private readonly apiUrl = environment.apiUrl;

  obtenerPorId(idLibro: number): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/libros/${idLibro}`);
  }

  obtenerDetalle(idLibro: number): Observable<LibroDetalle> {
    return this.http.get<LibroDetalle>(`${this.apiUrl}/libros/${idLibro}/detalle`);
  }

  crear(payload: LibroCreate): Observable<Libro> {
    return this.http
      .post<Libro>(`${this.apiUrl}/libros`, payload)
      .pipe(tap(() => this.catalogoService.refrescar()));
  }

  actualizar(idLibro: number, payload: LibroUpdate): Observable<Libro> {
    return this.http
      .put<Libro>(`${this.apiUrl}/libros/${idLibro}`, payload)
      .pipe(tap(() => this.catalogoService.refrescar()));
  }

  inhabilitar(idLibro: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/libros/${idLibro}`)
      .pipe(tap(() => this.catalogoService.refrescar()));
  }

  listarEjemplares(idLibro: number): Observable<Ejemplar[]> {
    return this.http.get<Ejemplar[]>(`${this.apiUrl}/libros/${idLibro}/ejemplares`);
  }

  crearEjemplares(idLibro: number, cantidad: number): Observable<Ejemplar[]> {
    return this.http
      .post<Ejemplar[]>(`${this.apiUrl}/libros/${idLibro}/ejemplares`, { cantidad })
      .pipe(tap(() => this.catalogoService.refrescar()));
  }

  listarGeneros(): Observable<Genero[]> {
    return this.http.get<Genero[]>(`${this.apiUrl}/generos`);
  }

  crearGenero(nombreGenero: string): Observable<Genero> {
    return this.http.post<Genero>(`${this.apiUrl}/generos`, {
      nombreGenero: nombreGenero.trim(),
    });
  }

  listarAutores(): Observable<Autor[]> {
    return this.http.get<Autor[]>(`${this.apiUrl}/autores`);
  }

  crearAutor(nombreAutor: string): Observable<Autor> {
    return this.http.post<Autor>(`${this.apiUrl}/autores`, {
      nombreAutor: nombreAutor.trim(),
    });
  }
}
