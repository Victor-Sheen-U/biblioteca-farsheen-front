import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioAdminCreate } from '../models/auth.model';

@Service()
export class AdminUsuariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  buscarPorId(idUsuario: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${idUsuario}`);
  }

  buscarPorDocumento(documento: string): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.apiUrl}/usuarios/documento/${encodeURIComponent(documento.trim())}`,
    );
  }

  crearUsuario(payload: UsuarioAdminCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, {
      ...payload,
      documentoIdentidad: payload.documentoIdentidad.trim(),
      nombreCompleto: payload.nombreCompleto.trim(),
      correo: payload.correo.trim().toLowerCase(),
    });
  }

  deshabilitarPorDocumento(documento: string): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.apiUrl}/usuarios/documento/${encodeURIComponent(documento.trim())}/deshabilitar`,
      {},
    );
  }
}
