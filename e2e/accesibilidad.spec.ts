import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const EVIDENCIAS_A11Y_DIR = '/home/victorsheen/biblioteca-integracion/evidencias/visuales-a11y';

function ratioContraste(rgbFg: string, rgbBg: string): number {
  const parseRgb = (cssColor: string): [number, number, number] => {
    const m = cssColor.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return [0, 0, 0];
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  };
  const luminancia = ([r, g, b]: [number, number, number]): number => {
    const canal = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const l1 = luminancia(parseRgb(rgbFg));
  const l2 = luminancia(parseRgb(rgbBg));
  const claro = Math.max(l1, l2);
  const oscuro = Math.min(l1, l2);
  return (claro + 0.05) / (oscuro + 0.05);
}

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCIAS_A11Y_DIR, { recursive: true });
});

test.describe('Widget de accesibilidad (A1–A13), Axe WCAG y capturas', () => {
  test('flujo completo A1–A13, persistencia, teclado, sin errores CSP/consola y capturas', async ({
    page,
  }) => {
    const erroresConsola: string[] = [];
    const erroresPagina: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        erroresConsola.push(msg.text());
      }
    });
    page.on('pageerror', (err) => erroresPagina.push(String(err)));

    await page.addInitScript(() => {
      (window as unknown as Record<string, string[]>).__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        (window as unknown as Record<string, string[]>).__cspViolations.push(
          `${e.violatedDirective}:${e.blockedURI}`,
        );
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('biblio.a11y');
      localStorage.removeItem('biblio.theme');
    });
    await page.reload();
    await expect(page.locator('app-book-card').first()).toBeVisible({ timeout: 20_000 });

    // (a) Abrir con clic y capturar botón y panel (claro y oscuro, 1440 y 375)
    const fab = page.locator('.a11y-fab');
    await expect(fab).toBeVisible();
    await fab.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'boton-light-1440.png') });

    await fab.click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'panel-light-1440.png') });

    await page.evaluate(() => {
      localStorage.setItem('biblio.theme', 'dark');
      document.documentElement.classList.add('dark-theme');
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'panel-dark-1440.png') });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'panel-dark-375.png') });

    await page.evaluate(() => {
      localStorage.setItem('biblio.theme', 'light');
      document.documentElement.classList.remove('dark-theme');
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'panel-light-375.png') });

    await page.setViewportSize({ width: 1440, height: 900 });

    // (e) Cerrar con Esc devuelve el foco al botón
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(fab).toBeFocused();

    // Captura botón oscuro en 375
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => document.documentElement.classList.add('dark-theme'));
    await page.waitForTimeout(80);
    await fab.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'boton-dark-375.png') });
    await page.evaluate(() => document.documentElement.classList.remove('dark-theme'));
    await page.setViewportSize({ width: 1440, height: 900 });

    // (a)/(e) Abrir con CTRL+U
    await page.keyboard.press('Control+u');
    await expect(dialog).toBeVisible();

    // (b) A1 Contraste + -> alto claro (AAA >= 7:1) y alto oscuro (AAA >= 7:1)
    const cardContraste = page.getByRole('button', { name: /Contraste \+/i });
    await cardContraste.click();
    await expect(page.locator('html')).toHaveClass(/a11y-contrast-high/);
    const ratioAltoClaro = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return { fg: style.color, bg: style.backgroundColor };
    });
    expect(ratioContraste(ratioAltoClaro.fg, ratioAltoClaro.bg)).toBeGreaterThanOrEqual(7);

    await cardContraste.click();
    await expect(page.locator('html')).toHaveClass(/a11y-contrast-dark/);
    const ratioAltoOscuro = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return { fg: style.color, bg: style.backgroundColor };
    });
    expect(ratioContraste(ratioAltoOscuro.fg, ratioAltoOscuro.bg)).toBeGreaterThanOrEqual(7);

    // A3 Agrandar texto -> comprobar fontSize computado > 16px (130%)
    const fontAntes = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    const cardTexto = page.getByRole('button', { name: /Agrandar texto/i });
    await cardTexto.click(); // 115%
    await cardTexto.click(); // 130%
    await expect(page.locator('html')).toHaveClass(/a11y-font-scaled/);
    const fontDespues = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(fontDespues).toBeGreaterThan(fontAntes);

    // A8 Detener animaciones -> comprobar transition/animation = 0s
    const cardAnim = page.getByRole('button', { name: /Detener animaciones/i });
    const animYaActiva = (await cardAnim.getAttribute('aria-pressed')) === 'true';
    if (!animYaActiva) {
      await cardAnim.click();
    }
    await expect(page.locator('html')).toHaveClass(/a11y-no-motion/);
    const duraciones = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { tr: cs.transitionDuration, an: cs.animationDuration };
    });
    expect(duraciones.tr).toMatch(/^0s/);
    expect(duraciones.an).toMatch(/^0s/);

    // A9 Ocultar imágenes -> comprobar portadas ocultas
    const cardImg = page.getByRole('button', { name: /Ocultar imágenes/i });
    await cardImg.click();
    await expect(page.locator('html')).toHaveClass(/a11y-hide-images/);
    const portadaOculta = await page.evaluate(() => {
      const cover = document.querySelector('.book-card__cover');
      return cover ? getComputedStyle(cover).display : 'none';
    });
    expect(portadaOculta).toBe('none');

    // A11 Saturación -> filter en .layout__main, nunca en html (no rompe position: fixed)
    const cardSat = page.getByRole('button', { name: /Saturación/i });
    await cardSat.click();
    await expect(page.locator('html')).toHaveClass(/a11y-sat-baja/);
    const filtros = await page.evaluate(() => ({
      htmlFilter: getComputedStyle(document.documentElement).filter,
      mainFilter: getComputedStyle(document.querySelector('.layout__main')!).filter,
    }));
    expect(filtros.htmlFilter).toBe('none');
    expect(filtros.mainFilter).not.toBe('none');

    // Capturas de página con varias opciones activas (1440 y 375)
    await page.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'activas-alto-oscuro-1440.png') });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(EVIDENCIAS_A11Y_DIR, 'activas-alto-oscuro-375.png') });
    await page.setViewportSize({ width: 1440, height: 900 });

    // (c) Recargar y comprobar persistencia
    await page.reload();
    await expect(page.locator('app-book-card').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('html')).toHaveClass(/a11y-contrast-dark/);
    await expect(page.locator('html')).toHaveClass(/a11y-font-scaled/);
    await expect(page.locator('html')).toHaveClass(/a11y-hide-images/);
    const storageGuardado = await page.evaluate(() => localStorage.getItem('biblio.a11y'));
    expect(storageGuardado).toContain('"contraste":"alto-oscuro"');

    // A13 Ocultar botón y recuperarlo desde el enlace del footer «Accesibilidad»
    await page.keyboard.press('Control+u');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: /Ocultar widget/i }).click();
    await page.keyboard.press('Escape');
    await expect(fab).toHaveCount(0);

    await page.locator('app-site-footer').getByRole('button', { name: 'Accesibilidad' }).click();
    await expect(dialog).toBeVisible();

    // (d) Restablecer todo
    await page.getByRole('button', { name: /Restablecer todas las configuraciones/i }).click();
    await expect(cardContraste).toHaveAttribute('aria-pressed', 'false');
    await expect(cardTexto).toHaveAttribute('aria-pressed', 'false');
    await expect(cardImg).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).not.toHaveClass(/a11y-contrast-dark/);
    await expect(page.locator('html')).not.toHaveClass(/a11y-font-scaled/);

    // (f) Cero violaciones CSP ni errores consola/página
    const csp: string[] = await page.evaluate(
      () => (window as unknown as Record<string, string[]>).__cspViolations ?? [],
    );
    expect(csp).toEqual([]);
    expect(erroresConsola).toEqual([]);
    expect(erroresPagina).toEqual([]);
  });

  test('auditoría @axe-core/playwright en login, home, catálogo y /reservas + verificación admin', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Auditar /login antes de iniciar sesión (guestGuard redirige si ya hay sesión)
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await page.locator('.a11y-fab').click();
    await page.getByRole('button', { name: /Contraste \+/i }).click();
    await page.getByRole('button', { name: /Agrandar texto/i }).click();
    const axeLogin = await new AxeBuilder({ page }).analyze();
    expect(
      axeLogin.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
      `Violaciones serious/critical en /login: ${JSON.stringify(axeLogin.violations)}`,
    ).toEqual([]);
    await page.keyboard.press('Escape');

    // Login como ADMIN para verificar rutas /admin/{libros,reservas,usuarios} y auditar /, /catalog, /reservas
    await page.fill('#login-correo', 'admin@biblioteca.com');
    await page.fill('#login-password', 'Admin12345*');
    await page.click('[data-testid="login-form"] button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:4200/', { timeout: 15_000 });

    for (const adminRuta of ['/admin/libros', '/admin/reservas', '/admin/usuarios']) {
      await page.goto(adminRuta);
      await expect(page).toHaveURL(new RegExp(adminRuta.replace(/\//g, '\\/')));
    }

    for (const ruta of ['/', '/catalog', '/reservas']) {
      await page.goto(ruta);
      if (ruta === '/' || ruta === '/catalog') {
        await expect(page.locator('app-book-card').first()).toBeVisible({ timeout: 15_000 });
      } else {
        await expect(page.locator('#loans-page-title')).toBeVisible({ timeout: 15_000 });
      }
      await expect(page.locator('.a11y-fab')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('Control+u');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      const res = await new AxeBuilder({ page }).analyze();
      const graves = res.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(graves, `Violaciones serious/critical en ${ruta}: ${JSON.stringify(graves)}`).toEqual(
        [],
      );
      await page.keyboard.press('Escape');
    }
  });
});
