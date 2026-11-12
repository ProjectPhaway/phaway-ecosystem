import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? '';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const IMAGE = fileURLToPath(new URL('../public/personalizados/koala.jpg', import.meta.url));

test.skip(!EMAIL || !PASSWORD, 'Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD');

test('admin sube un producto, aparece en la tienda y se reserva por WhatsApp', async ({ page }) => {
  const name = `E2E Camiseta ${Date.now()}`;

  // Login con clave incorrecta muestra error
  await page.goto('/admin');
  await page.getByLabel('Correo').fill(EMAIL);
  await page.getByLabel('Contraseña').fill('clave-incorrecta');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('incorrectos');

  // Login correcto
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();

  // Crear producto
  await page.getByRole('link', { name: 'Nuevo producto' }).click();
  await page.getByRole('button', { name: 'Publicar producto' }).click();
  await expect(page.getByText('Sube al menos una foto')).toBeVisible();

  await page.locator('input[type=file]').setInputFiles(IMAGE);
  await expect(page.getByAltText('Foto principal')).toBeVisible();
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('Categoría').selectOption({ label: 'Camisetas' });
  await page.getByLabel('Precio (S/)').fill('59.90');
  await page.getByLabel('Poner en Liquidación').check();
  await page.getByRole('textbox', { name: 'Color', exact: true }).fill('Verde');
  await page.getByRole('button', { name: 'Agregar S, M, L, XL' }).click();
  await page.getByLabel('Stock fila 2').fill('3'); // M
  await page.getByRole('button', { name: 'Publicar producto' }).click();

  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toContainText('Liquidación');
  await expect(row).toContainText('3');

  // Aparece en Liquidación y en su ficha
  await page.goto('/liquidacion');
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('S/ 59.90').first()).toBeVisible();

  // Solo M tiene stock: S debe estar deshabilitada
  await expect(page.getByRole('button', { name: 'S', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'M', exact: true }).click();
  await expect(page.getByText('Quedan 3')).toBeVisible();

  const wa = page.getByRole('link', { name: 'Reservar por WhatsApp' });
  const href = decodeURIComponent((await wa.getAttribute('href')) ?? '');
  expect(href).toContain('https://wa.me/51965769340');
  expect(href).toContain(`Producto: ${name}`);
  expect(href).toContain('Talla: M');
  expect(href).toContain('Color: Verde');
  expect(href).toContain('Precio: S/ 59.90');

  // Limpieza: eliminar desde el panel (doble clic de confirmacion)
  await page.goto('/admin/productos');
  const del = page.getByRole('row', { name: new RegExp(name) }).getByRole('button', { name: /Eliminar/ });
  await del.click();
  await del.click();
  await expect(page.getByRole('status')).toContainText('se eliminó');
});
