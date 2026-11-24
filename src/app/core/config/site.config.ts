export interface ContactoConfig {
  readonly direccion?: string;
  readonly correo?: string;
  readonly telefono?: string;
  readonly horario?: string;
}

export interface SiteConfig {
  readonly nombre: string;
  readonly nombreCorto: string;
  readonly subtitulo: string;
  readonly descripcionFooter: string;
  readonly recomendaciones: readonly string[];
  readonly contacto: ContactoConfig;
}

export const SITE_CONFIG: SiteConfig = {
  nombre: 'Biblioteca farsheen',
  nombreCorto: 'Biblioteca farsheen',
  subtitulo: 'Sistema de Reservas',
  descripcionFooter:
    'Catálogo bibliográfico público y gestión digital de reservas con disponibilidad en tiempo real por rango de fecha y hora.',
  recomendaciones: [
    'Cancela tus reservas hasta 24 horas antes de la fecha de inicio si no podrás asistir.',
    'Toda reserva requiere una fecha y hora de inicio futura y una fecha de entrega posterior.',
    'Consulta la disponibilidad de ejemplares físicos antes de confirmar tu reserva.',
  ],
  contacto: {},
};
