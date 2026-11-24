import { Component, input, output } from '@angular/core';
import { LibroCatalogo } from '../../../../core/models/libro.model';
import { ButtonComponent } from '../../atoms/button/button.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { BookCardComponent } from '../../molecules/book-card/book-card.component';

@Component({
  selector: 'app-book-grid',
  standalone: true,
  imports: [BookCardComponent, ButtonComponent, IconComponent],
  templateUrl: './book-grid.component.html',
  styleUrl: './book-grid.component.scss',
})
export class BookGridComponent {
  readonly libros = input.required<readonly LibroCatalogo[]>();
  readonly tituloVacio = input<string>('No encontramos libros con esos filtros');
  readonly descripcionVacia = input<string>(
    'Prueba limpiando los filtros activos o buscando con otros términos.',
  );
  readonly textoAccionVacia = input<string>('Limpiar filtros');

  readonly reservar = output<LibroCatalogo>();
  readonly verDetalles = output<number>();
  readonly limpiarFiltros = output<void>();
}
