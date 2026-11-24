import { Reserva } from './reserva.model';

export interface Autor {
  readonly idAutor: number;
  readonly nombreAutor: string;
}

export interface Genero {
  readonly idGenero: number;
  readonly nombreGenero: string;
}

export interface Libro {
  readonly idLibro: number;
  readonly isbn: string;
  readonly titulo: string;
  readonly idGenero: number;
  readonly nombreGenero: string;
  readonly autores: readonly Autor[];
  readonly anioPublicacion?: number | null;
  readonly estado: boolean;
}

export interface LibroCreate {
  readonly isbn: string;
  readonly titulo: string;
  readonly idGenero: number;
  readonly idsAutores: readonly number[];
  readonly anioPublicacion?: number | null;
}

export type LibroUpdate = LibroCreate;

export interface LibroCatalogo {
  readonly idLibro: number;
  readonly isbn: string;
  readonly titulo: string;
  readonly idGenero: number;
  readonly nombreGenero: string;
  readonly autores: readonly Autor[];
  readonly anioPublicacion: number | null;
  readonly totalEjemplares: number;
  readonly ejemplaresDisponibles: number;
}

export interface Disponibilidad {
  readonly idLibro: number;
  readonly fechaHora: string;
  readonly disponible: boolean;
  readonly ejemplaresDisponibles: number;
}

export interface Ejemplar {
  readonly idEjemplar: number;
  readonly idLibro: number;
  readonly estadoDisponibilidad: string;
}

export interface LibroDetalle {
  readonly libro: Libro;
  readonly totalReservas: number;
  readonly reservas: readonly Reserva[];
}
