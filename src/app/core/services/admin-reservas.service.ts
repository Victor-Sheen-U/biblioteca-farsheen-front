import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reserva } from '../models/reserva.model';

@Service()
export class AdminReservasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listarTodas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/reservas`);
  }

  listarPorUsuario(idUsuario: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/reservas/usuario/${idUsuario}`);
  }

  cancelarComoAdmin(idReserva: number): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.apiUrl}/reservas/${idReserva}/cancelar-admin`, {});
  }
}
