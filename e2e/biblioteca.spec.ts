import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const EVIDENCIAS_DIR = '/home/victorsheen/biblioteca-integracion/evidencias/visuales';

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
});

async function capturarModoClaroYOscuro(
  page: import('@playwright/test').Page,
  nombre: string,
  anchos: readonly number[] = [375, 768, 1440],
) {
  for (const width of anchos) {
    const height = width < 768 ? 812 : 900;
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      localStorage.setItem('biblio.theme', 'light');
      document.documentElement.classList.remove('dark-theme');
    });
    await page.waitForTimeout(120);
    const sinDesborde = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(sinDesborde, `Desborde horizontal en ${nombre} a ${width}px`).toBe(true);
    await page.screenshot({
      path: path.join(EVIDENCIAS_DIR, `${nombre}-light-${width}.png`),
      fullPage: false,
    });

    await page.evaluate(() => {
      localStorage.setItem('biblio.theme', 'dark');
      document.documentElement.classList.add('dark-theme');
    });
    await page.waitForTimeout(120);
    await page.screenshot({
      path: path.join(EVIDENCIAS_DIR, `${nombre}-dark-${width}.png`),
      fullPage: false,
    });
  }
  // Restaurar claro
  await page.evaluate(() => {
    localStorage.removeItem('biblio.theme');
    document.documentElement.classList.remove('dark-theme');
  });
  await page.setViewportSize({ width: 1440, height: 900 });
}

test.describe('Suite E2E · Biblioteca farsheen (§12.4 y §12.5)', () => {
  test('(a) Visitante ve Home y Catálogo con >= 40 libros y paginación de 12 + capturas', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('app-book-card').first()).toBeVisible({ timeout: 15_000 });
    const brandLink = page.locator('app-header app-brand a');
    await expect(brandLink).toHaveAttribute('aria-disabled', 'true');
    await capturarModoClaroYOscuro(page, 'home');

    await page.goto('/catalog');
    await expect(page.locator('app-book-card')).toHaveCount(12, { timeout: 15_000 });
    await expect(page.getByTestId('catalog-pagination-info')).toContainText('Página 1 de');
    await capturarModoClaroYOscuro(page, 'catalog');

    // Navegar a detalle del primer libro
    await page.locator('app-book-card .book-card__title').first().click();
    await expect(page).toHaveURL(/\/catalog\/\d+/);
    await expect(page.locator('#book-detail-title')).toBeVisible();
    await capturarModoClaroYOscuro(page, 'detail');
  });

  test('(b), (c), (d), (e), (g) Registro -> Login -> Detalle -> Reservar -> Mis reservas -> Cancelar >24h -> Bloqueo /admin -> Token alterado', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await capturarModoClaroYOscuro(page, 'login');

    // (b) Registro -> Login automático
    await page.getByTestId('tab-registro').click();
    const sufijo = Date.now().toString().slice(-7);
    const correo = `e2e.${sufijo}@biblioteca.com`;
    await page.fill('#reg-documento', `1095${sufijo}`);
    await page.fill('#reg-nombre', 'Laura Gómez E2E');
    await page.fill('#reg-correo', correo);
    await page.fill('#reg-password', 'Lectura2026*');
    await page.fill('#reg-confirmar', 'Lectura2026*');
    await page.click('[data-testid="register-form"] button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:4200/');
    await expect(page.locator('.site-header__user-name')).toContainText('Laura Gómez E2E');

    // (e) Rol USUARIO no entra a /admin (redirige a /) y back responde 403 a llamada directa
    await page.goto('/admin');
    await expect(page).toHaveURL('http://localhost:4200/');
    const statusAdminBack = await page.evaluate(async () => {
      const raw = localStorage.getItem('biblio.session');
      const token = raw ? JSON.parse(raw).token : '';
      const res = await fetch('/biblioteca/api/v1/usuarios/1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.status;
    });
    expect(statusAdminBack).toBe(403);

    // (c) Catálogo disponibles -> Detalle -> Reservar -> aparece en Mis reservas
    await page.goto('/catalog?disp=1');
    await expect(page.locator('app-book-card').first()).toBeVisible();
    await page.locator('app-book-card .book-card__title').first().click();
    await expect(page).toHaveURL(/\/catalog\/\d+/);
    await page.getByRole('button', { name: 'Reservar' }).click();

    const dialog = page.locator('.reserva-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirmar reserva' }).click();

    const drawer = page.getByTestId('reservas-drawer-panel');
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await drawer.getByTestId('reservas-drawer-expand-btn').click();
    await expect(page).toHaveURL(/\/reservas$/, { timeout: 10_000 });
    await expect(page.locator('#loans-page-title')).toContainText('Mis reservas');
    await expect(page.locator('tr[data-loan-row-id]').first()).toBeVisible();
    await capturarModoClaroYOscuro(page, 'reservas');

    // (d) Cancelar con > 24 h
    await page.locator('.loans-table__cancel-btn').first().click();
    await page
      .locator('.loans-confirm-dialog')
      .getByRole('button', { name: 'Confirmar cancelación' })
      .click();
    await page.getByRole('tab', { name: /Canceladas/i }).click();
    await expect(page.locator('tr[data-loan-row-id]').first()).toBeVisible();

    // (g) Token alterado en localStorage => petición protegida / llamada vuelve a /login
    await page.evaluate(() => {
      const raw = localStorage.getItem('biblio.session');
      const ses = raw ? JSON.parse(raw) : {};
      ses.token = ses.token.slice(0, -4) + 'XXXX';
      localStorage.setItem('biblio.session', JSON.stringify(ses));
    });
    await page.goto('/reservas');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Freservas/, { timeout: 10_000 });
  });

  test('(f) Login ADMIN -> crea libro y lo inhabilita -> desaparece del catálogo + capturas admin', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('#login-correo', 'admin@biblioteca.com');
    await page.fill('#login-password', 'Admin12345*');
    await page.click('[data-testid="login-form"] button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:4200/');

    await expect(page.getByTestId('header-admin-link')).toBeVisible();
    await page.getByTestId('header-admin-link').click();
    await expect(page).toHaveURL(/\/admin\/libros/);
    await expect(page.locator('#admin-libros-title')).toBeVisible();
    await capturarModoClaroYOscuro(page, 'admin');

    const sufijo = Date.now().toString().slice(-6);
    const tituloNuevo = `Libro Prueba E2E ${sufijo}`;
    const isbnNuevo = `978-958-${sufijo}`;

    await page.getByRole('button', { name: 'Nuevo libro' }).click();
    await page.fill('#adm-isbn', isbnNuevo);
    await page.fill('#adm-titulo', tituloNuevo);
    await page.fill('#adm-anio', '2025');
    // Seleccionar primer autor disponible
    await page.locator('.admin-checks input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: 'Guardar libro' }).click();

    const filaNueva = page.locator('tr', { hasText: tituloNuevo });
    await expect(filaNueva).toBeVisible({ timeout: 10_000 });

    // Inhabilitar el libro recién creado
    await filaNueva.getByRole('button', { name: 'Inhabilitar' }).click();
    await page.locator('.admin-modal--sm').getByRole('button', { name: 'Inhabilitar' }).click();
    await expect(filaNueva).toHaveCount(0, { timeout: 10_000 });

    // Verificar que desaparece del catálogo público
    await page.goto(`/catalog?q=${encodeURIComponent(tituloNuevo)}`);
    await expect(page.getByTestId('book-grid-empty')).toBeVisible();
  });
});
