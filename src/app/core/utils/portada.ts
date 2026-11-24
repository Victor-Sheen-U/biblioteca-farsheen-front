export interface EstiloPortadaLibro {
  readonly gradiente: string;
  readonly acento: string;
  readonly iniciales: string;
}

const PALETAS_PORTADA: readonly { gradiente: string; acento: string }[] = [
  {
    gradiente: 'linear-gradient(145deg, #1E3A8A 0%, #1D4ED8 55%, #0284C7 100%)',
    acento: '#BAE6FD',
  },
  {
    gradiente: 'linear-gradient(145deg, #0F172A 0%, #1E293B 55%, #1E3A8A 100%)',
    acento: '#E2E8F0',
  },
  {
    gradiente: 'linear-gradient(145deg, #064E3B 0%, #047857 55%, #0D9488 100%)',
    acento: '#A7F3D0',
  },
  {
    gradiente: 'linear-gradient(145deg, #78350F 0%, #B45309 55%, #D97706 100%)',
    acento: '#FDE68A',
  },
  {
    gradiente: 'linear-gradient(145deg, #164E63 0%, #0E7490 55%, #0284C7 100%)',
    acento: '#CFFAFE',
  },
  {
    gradiente: 'linear-gradient(145deg, #334155 0%, #475569 55%, #0284C7 100%)',
    acento: '#E0F2FE',
  },
];

/**
 * Calcula una portada tipográfica determinista basada en idGenero y título.
 */
export function generarEstiloPortada(idGenero: number, titulo: string): EstiloPortadaLibro {
  let hash = Math.abs(idGenero || 0) * 31;
  for (let i = 0; i < titulo.length; i++) {
    hash = (hash * 33 + titulo.charCodeAt(i)) >>> 0;
  }

  const paleta = PALETAS_PORTADA[hash % PALETAS_PORTADA.length];
  const palabras = titulo
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  let iniciales = 'BF';
  if (palabras.length >= 2) {
    iniciales = (palabras[0][0] + palabras[1][0]).toUpperCase();
  } else if (palabras.length === 1) {
    iniciales = palabras[0].slice(0, 2).toUpperCase();
  }

  return {
    gradiente: paleta.gradiente,
    acento: paleta.acento,
    iniciales,
  };
}
