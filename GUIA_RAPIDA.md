# Guía rápida de uso — Biblioteca farsheen

## 1. Cómo iniciar el sistema en desarrollo

1. Inicia MySQL/MariaDB en el puerto local `3307`.
2. Arranca el **backend** (carga automáticamente el catálogo semilla de 44 libros):
   ```bash
   cd /home/victorsheen/biblioteca-farsheen
   SPRING_PROFILES_ACTIVE=dev,seed ./gradlew bootRun
   ```
   API en `http://localhost:10101/biblioteca/api/v1` · Swagger en `http://localhost:10101/biblioteca/swagger-ui.html`.
3. Arranca el **frontend** en otra terminal:
   ```bash
   cd /home/victorsheen/biblioteca-farsheen-front
   npm ci && npm start
   ```
   Abre **`http://localhost:4200`**.

## 2. Usar el portal como lector

- **Explorar libros:** entra a `/` o `/catalog`, busca por título, autor o género, filtra por disponibilidad y abre cualquier libro (`/catalog/:id`) para ver sus ejemplares y fechas libres.
- **Crear cuenta e iniciar sesión:** ve a `/login` (pestaña *Crear cuenta*) o inicia sesión con un correo registrado.
- **Reservar y consultar reservas:** en el detalle de un libro elige fecha de inicio y entrega y confirma con **Reservar**. Consulta o cancela reservas (con > 24 h de antelación) en el panel lateral o en `/reservas` (incluye búsqueda por ID).

## 3. Panel de administración *(solo desarrollo)*

> **Aviso de seguridad:** las credenciales siguientes son **exclusivas para entorno local de desarrollo** (`dev`); en producción (`prod`) la contraseña se define mediante `ADMIN_PASSWORD` y nunca debe publicarse.

- **Correo (solo desarrollo):** `admin@biblioteca.com`
- **Contraseña (solo desarrollo):** `Admin12345*`

1. Ingresa a `http://localhost:4200/login` e inicia sesión con esa cuenta `ADMIN`.
2. Haz clic en **Administración** en la cabecera o entra directo a:
   - `/admin/libros` — crear, editar, inhabilitar libros y agregar ejemplares.
   - `/admin/reservas` — listar todas las reservas, filtrar por usuario y cancelar administrativamente.
   - `/admin/usuarios` — crear cuentas, buscar por ID o documento e inhabilitar lectores.

## 4. Menú de accesibilidad (`CTRL+U`)

- Pulsa el botón flotante circular (esquina inferior izquierda) o presiona **`CTRL+U`** (también disponible en el pie de página bajo **Accesibilidad**).
- Activa **Contraste +** (alto claro/oscuro AAA), **Agrandar texto** (`100 %–150 %`), **Resaltar enlaces**, **Espaciado de texto**, **Altura de línea**, **Texto alineado**, **Fuente dislexia**, **Detener animaciones**, **Ocultar imágenes**, **Cursor grande** o **Saturación**.
- Usa **Restablecer todas las configuraciones** para volver al estado inicial o **Mover / Ocultar widget** para reubicar u ocultar el botón flotante.
