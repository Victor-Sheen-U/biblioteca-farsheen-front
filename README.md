# Biblioteca farsheen · Frontend (Angular 22)

Aplicación web frontend para **Biblioteca farsheen**, construida con **Angular 22 (Zoneless + Signals)**, **Atomic Design (`core / shared/ui / features`)**, paleta oficial en `src/styles.scss`, tema tri-estado y comunicación HTTP REST + JWT con la API Spring Boot.

## 1. Requisitos e inicio rápido

- **Node.js `>= 22.x`** y **npm `>= 10.x`**
- **Backend activo** en `http://localhost:10101/biblioteca/api/v1`

```bash
npm ci
npm start        # http://localhost:4200 (usa proxy.conf.json -> localhost:10101)
```

## 2. Entornos y proxy

| Archivo | Uso | `apiUrl` |
|---|---|---|
| `proxy.conf.json` | Proxy dev `/biblioteca` → `http://localhost:10101` | — |
| `src/environments/environment.development.ts` | Desarrollo (`ng serve`, `ng test`) | `/biblioteca/api/v1` |
| `src/environments/environment.ts` | Producción (`ng build`) | `/biblioteca/api/v1` |

## 3. Rutas principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Pública | Inicio estilo Apple con buscador, novedades, géneros y guía en 3 pasos |
| `/catalog` | Pública | Catálogo con filtros sincronizados, búsqueda difusa y paginación de 12 |
| `/catalog/:id` | Pública | Detalle del libro, disponibilidad por fecha (RFN8) y reserva |
| `/login` | Invitados (`guestGuard`) | Inicio de sesión y registro (`?modo=registro`, `?returnUrl=...`) |
| `/reservas` | Autenticado (`authGuard`) | Mis reservas, consulta por ID (RFN15) y cancelación (> 24 h) |
| `/admin/{libros,reservas,usuarios}` | Solo `ADMIN` (`roleGuard`) | Panel mínimo de administración (CRUD libros, ejemplares, reservas, usuarios) |

Redirects de compatibilidad: `/loans` → `/reservas`, `/register` → `/login?modo=registro`, `/book/:id` → `/catalog/:id`.

## 4. Comandos de verificación

```bash
npx ng test --watch=false   # Pruebas unitarias Vitest
npx ng build                # Build de producción
npm run e2e                 # Suite E2E en Chromium (Playwright)
npm audit --omit=dev        # Auditoría de dependencias de producción
```

Consulta [ARQUITECTURA_Y_COMUNICACION.md](ARQUITECTURA_Y_COMUNICACION.md) para los flujos de autenticación, reservas y seguridad en cliente, [docs/ACCESIBILIDAD.md](docs/ACCESIBILIDAD.md) para el menú de accesibilidad (`CTRL+U`) y [GUIA_RAPIDA.md](GUIA_RAPIDA.md) para la guía rápida de uso y acceso administrativo en desarrollo.
