import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../../core/models/api-error.model';
import { Rol, Usuario } from '../../../../core/models/auth.model';
import { AdminUsuariosService } from '../../../../core/services/admin-usuarios.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

@Component({
  selector: 'app-admin-usuarios-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, BadgeComponent, ButtonComponent, IconComponent],
  templateUrl: './admin-usuarios-page.component.html',
  styleUrl: '../admin-libros-page/admin-libros-page.component.scss',
})
export class AdminUsuariosPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminUsuarios = inject(AdminUsuariosService);
  private readonly notifications = inject(NotificationService);

  readonly tipoBusqueda = signal<'documento' | 'id'>('documento');
  readonly terminoBusqueda = signal<string>('');
  readonly buscando = signal<boolean>(false);
  readonly usuarioEncontrado = signal<Usuario | null>(null);
  readonly errorBusqueda = signal<string | null>(null);

  readonly modalCrearAbierto = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);
  readonly errorCrear = signal<string | null>(null);

  readonly usuarioForm = this.fb.nonNullable.group({
    documentoIdentidad: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z0-9._-]+$/),
      ],
    ],
    nombreCompleto: ['', [Validators.required, Validators.maxLength(150)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(60)]],
    rol: ['ADMIN' as Rol, [Validators.required]],
  });

  buscarUsuario(event: Event): void {
    event.preventDefault();
    const valor = this.terminoBusqueda().trim();
    if (!valor) return;

    this.buscando.set(true);
    this.errorBusqueda.set(null);
    this.usuarioEncontrado.set(null);

    const obs$ =
      this.tipoBusqueda() === 'id'
        ? this.adminUsuarios.buscarPorId(Number.parseInt(valor, 10))
        : this.adminUsuarios.buscarPorDocumento(valor);

    obs$.subscribe({
      next: (u) => {
        this.usuarioEncontrado.set(u);
        this.buscando.set(false);
      },
      error: (err: Partial<ApiError>) => {
        this.errorBusqueda.set(err?.mensaje || 'Usuario no encontrado.');
        this.buscando.set(false);
      },
    });
  }

  deshabilitarEncontrado(): void {
    const u = this.usuarioEncontrado();
    if (!u || !u.estado || this.guardando()) return;

    this.guardando.set(true);
    this.adminUsuarios.deshabilitarPorDocumento(u.documentoIdentidad).subscribe({
      next: (actualizado) => {
        this.usuarioEncontrado.set(actualizado);
        this.guardando.set(false);
        this.notifications.show(`Usuario ${actualizado.correo} deshabilitado.`, 'success');
      },
      error: (err: Partial<ApiError>) => {
        this.guardando.set(false);
        this.notifications.show(err?.mensaje || 'No se pudo deshabilitar el usuario.', 'error');
      },
    });
  }

  abrirModalCrear(): void {
    this.errorCrear.set(null);
    this.usuarioForm.reset({
      documentoIdentidad: '',
      nombreCompleto: '',
      correo: '',
      password: '',
      rol: 'ADMIN',
    });
    this.modalCrearAbierto.set(true);
  }

  crearUsuario(): void {
    if (this.guardando()) return;
    this.errorCrear.set(null);
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      this.errorCrear.set('Verifica los campos del formulario.');
      return;
    }

    this.guardando.set(true);
    this.adminUsuarios.crearUsuario(this.usuarioForm.getRawValue()).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.modalCrearAbierto.set(false);
        this.usuarioEncontrado.set(creado);
        this.notifications.show(`Usuario ${creado.correo} (${creado.rol}) creado.`, 'success');
      },
      error: (err: Partial<ApiError>) => {
        this.guardando.set(false);
        this.errorCrear.set(err?.mensaje || 'No se pudo crear el usuario.');
      },
    });
  }
}
