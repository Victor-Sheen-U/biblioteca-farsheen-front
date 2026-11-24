import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../../core/models/api-error.model';
import {
  Autor,
  Ejemplar,
  Genero,
  LibroCatalogo,
  LibroDetalle,
} from '../../../../core/models/libro.model';
import { AdminLibrosService } from '../../../../core/services/admin-libros.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

@Component({
  selector: 'app-admin-libros-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    BadgeComponent,
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './admin-libros-page.component.html',
  styleUrl: './admin-libros-page.component.scss',
})
export class AdminLibrosPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly catalogoService = inject(CatalogoService);
  private readonly adminLibros = inject(AdminLibrosService);
  private readonly notifications = inject(NotificationService);

  readonly filtro = signal<string>('');
  readonly generos = signal<readonly Genero[]>([]);
  readonly autores = signal<readonly Autor[]>([]);
  readonly guardando = signal<boolean>(false);

  // Modal crear/editar libro
  readonly modalLibroAbierto = signal<boolean>(false);
  readonly libroEditandoId = signal<number | null>(null);
  readonly autoresSeleccionados = signal<readonly number[]>([]);
  readonly nuevoGeneroNombre = signal<string>('');
  readonly nuevoAutorNombre = signal<string>('');
  readonly errorFormulario = signal<string | null>(null);

  // Modal ejemplares
  readonly libroEjemplares = signal<LibroCatalogo | null>(null);
  readonly ejemplaresLista = signal<readonly Ejemplar[]>([]);
  readonly cantidadEjemplares = signal<number>(1);
  readonly cargandoEjemplares = signal<boolean>(false);

  // Modal detalle RFN9
  readonly detalleModal = signal<LibroDetalle | null>(null);
  readonly cargandoDetalle = signal<boolean>(false);

  // Modal confirmar baja lógica
  readonly libroInhabilitar = signal<LibroCatalogo | null>(null);

  readonly librosFiltrados = computed<readonly LibroCatalogo[]>(() => {
    const q = this.filtro().trim().toLowerCase();
    const lista = this.catalogoService.libros();
    if (!q) return lista;
    return lista.filter(
      (l) =>
        l.titulo.toLowerCase().includes(q) ||
        l.isbn.toLowerCase().includes(q) ||
        l.nombreGenero.toLowerCase().includes(q),
    );
  });

  readonly libroForm = this.fb.nonNullable.group({
    isbn: ['', [Validators.required, Validators.maxLength(20)]],
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    idGenero: [0, [Validators.required, Validators.min(1)]],
    anioPublicacion: [''],
  });

  ngOnInit(): void {
    this.catalogoService.cargarSiNecesario();
    this.cargarCatalogosSoporte();
  }

  cargarCatalogosSoporte(): void {
    this.adminLibros.listarGeneros().subscribe({
      next: (lista) => this.generos.set(lista),
    });
    this.adminLibros.listarAutores().subscribe({
      next: (lista) => this.autores.set(lista),
    });
  }

  abrirCrearLibro(): void {
    this.cargarCatalogosSoporte();
    this.libroEditandoId.set(null);
    this.errorFormulario.set(null);
    this.autoresSeleccionados.set([]);
    this.libroForm.reset({
      isbn: '',
      titulo: '',
      idGenero: this.generos()[0]?.idGenero ?? 0,
      anioPublicacion: '',
    });
    this.modalLibroAbierto.set(true);
  }

  abrirEditarLibro(libro: LibroCatalogo): void {
    this.cargarCatalogosSoporte();
    this.libroEditandoId.set(libro.idLibro);
    this.errorFormulario.set(null);
    this.autoresSeleccionados.set(libro.autores.map((a) => a.idAutor));
    this.libroForm.reset({
      isbn: libro.isbn,
      titulo: libro.titulo,
      idGenero: libro.idGenero,
      anioPublicacion: libro.anioPublicacion ? String(libro.anioPublicacion) : '',
    });
    this.modalLibroAbierto.set(true);
  }

  cerrarModalLibro(): void {
    if (!this.guardando()) {
      this.modalLibroAbierto.set(false);
    }
  }

  alternarAutorForm(idAutor: number): void {
    const actuales = this.autoresSeleccionados();
    this.autoresSeleccionados.set(
      actuales.includes(idAutor) ? actuales.filter((id) => id !== idAutor) : [...actuales, idAutor],
    );
  }

  crearGeneroInline(): void {
    const nombre = this.nuevoGeneroNombre().trim();
    if (!nombre) return;
    this.adminLibros.crearGenero(nombre).subscribe({
      next: (creado) => {
        this.generos.update((prev) => [...prev, creado]);
        this.libroForm.controls.idGenero.setValue(creado.idGenero);
        this.nuevoGeneroNombre.set('');
        this.notifications.show(`Género «${creado.nombreGenero}» creado.`, 'success');
      },
      error: (err: Partial<ApiError>) => {
        this.notifications.show(err?.mensaje || 'No se pudo crear el género.', 'error');
      },
    });
  }

  crearAutorInline(): void {
    const nombre = this.nuevoAutorNombre().trim();
    if (!nombre) return;
    this.adminLibros.crearAutor(nombre).subscribe({
      next: (creado) => {
        this.autores.update((prev) => [...prev, creado]);
        this.autoresSeleccionados.update((prev) => [...prev, creado.idAutor]);
        this.nuevoAutorNombre.set('');
        this.notifications.show(`Autor «${creado.nombreAutor}» creado.`, 'success');
      },
      error: (err: Partial<ApiError>) => {
        this.notifications.show(err?.mensaje || 'No se pudo crear el autor.', 'error');
      },
    });
  }

  guardarLibro(): void {
    if (this.guardando()) return;
    this.errorFormulario.set(null);

    if (this.libroForm.invalid) {
      this.libroForm.markAllAsTouched();
      this.errorFormulario.set('Completa los campos obligatorios del libro.');
      return;
    }

    if (this.autoresSeleccionados().length === 0) {
      this.errorFormulario.set('Selecciona al menos un autor.');
      return;
    }

    const raw = this.libroForm.getRawValue();
    const anioNum = raw.anioPublicacion.trim()
      ? Number.parseInt(raw.anioPublicacion.trim(), 10)
      : null;

    const payload = {
      isbn: raw.isbn.trim(),
      titulo: raw.titulo.trim(),
      idGenero: Number(raw.idGenero),
      idsAutores: [...this.autoresSeleccionados()],
      anioPublicacion: anioNum,
    };

    this.guardando.set(true);
    const idEdit = this.libroEditandoId();
    const req$ = idEdit
      ? this.adminLibros.actualizar(idEdit, payload)
      : this.adminLibros.crear(payload);

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalLibroAbierto.set(false);
        this.notifications.show(
          idEdit ? 'Libro actualizado correctamente.' : 'Libro creado correctamente.',
          'success',
        );
      },
      error: (err: Partial<ApiError>) => {
        this.guardando.set(false);
        this.errorFormulario.set(err?.mensaje || 'Error al guardar el libro.');
      },
    });
  }

  abrirEjemplares(libro: LibroCatalogo): void {
    this.libroEjemplares.set(libro);
    this.cantidadEjemplares.set(1);
    this.cargandoEjemplares.set(true);
    this.adminLibros.listarEjemplares(libro.idLibro).subscribe({
      next: (lista) => {
        this.ejemplaresLista.set(lista);
        this.cargandoEjemplares.set(false);
      },
      error: () => {
        this.ejemplaresLista.set([]);
        this.cargandoEjemplares.set(false);
      },
    });
  }

  agregarEjemplares(): void {
    const libro = this.libroEjemplares();
    const cant = Number(this.cantidadEjemplares());
    if (!libro || !Number.isInteger(cant) || cant < 1) return;

    this.guardando.set(true);
    this.adminLibros.crearEjemplares(libro.idLibro, cant).subscribe({
      next: (creados) => {
        this.ejemplaresLista.update((prev) => [...prev, ...creados]);
        this.guardando.set(false);
        this.notifications.show(`Se agregaron ${creados.length} ejemplares.`, 'success');
      },
      error: (err: Partial<ApiError>) => {
        this.guardando.set(false);
        this.notifications.show(err?.mensaje || 'No se pudieron crear ejemplares.', 'error');
      },
    });
  }

  abrirDetalle(libro: LibroCatalogo): void {
    this.cargandoDetalle.set(true);
    this.detalleModal.set(null);
    this.adminLibros.obtenerDetalle(libro.idLibro).subscribe({
      next: (det) => {
        this.detalleModal.set(det);
        this.cargandoDetalle.set(false);
      },
      error: (err: Partial<ApiError>) => {
        this.cargandoDetalle.set(false);
        this.notifications.show(err?.mensaje || 'No se pudo consultar el detalle.', 'error');
      },
    });
  }

  confirmarInhabilitar(): void {
    const libro = this.libroInhabilitar();
    if (!libro || this.guardando()) return;
    this.guardando.set(true);
    this.adminLibros.inhabilitar(libro.idLibro).subscribe({
      next: () => {
        this.guardando.set(false);
        this.libroInhabilitar.set(null);
        this.notifications.show(`Libro «${libro.titulo}» inhabilitado.`, 'success');
      },
      error: (err: Partial<ApiError>) => {
        this.guardando.set(false);
        this.libroInhabilitar.set(null);
        this.notifications.show(err?.mensaje || 'No se pudo inhabilitar el libro.', 'error');
      },
    });
  }
}
