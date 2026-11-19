import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? '';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const IMAGE = fileURLToPath(new URL('../public/personalizados/koala.jpg', import.meta.url));

test.skip(!EMAIL || !PASSWORD, 'Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD');

/**
 * Flujo de ventas: crea un producto con stock, registra un pedido, confirma
 * (descuenta stock), intenta pagar un monto inválido (rechazado), paga el saldo,
 * marca entregado. Deja limpio el producto al final.
 */
test('registrar pedido descuenta stock y actualiza estado', async ({ page }) => {
  const stamp = Date.now();
  const productName = `E2E Camiseta Venta ${stamp}`;
  const couponCode = `E2E${stamp}`;

  // --- login
  await page.goto('/admin');
  await page.getByLabel('Correo').fill(EMAIL);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();

  // --- producto con 1 variante y stock 5
  await page.getByRole('link', { name: 'Productos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();
  await page.getByRole('link', { name: 'Nuevo producto' }).click();
  await page.locator('input[type=file]').setInputFiles(IMAGE);
  await page.getByAltText('Foto principal').waitFor();
  await page.getByLabel('Nombre').fill(productName);
  await page.getByLabel('Categoría').selectOption({ label: 'Camisetas' });
  await page.getByLabel('Precio (S/)').fill('100.00');
  await page.getByRole('textbox', { name: 'Color', exact: true }).fill('Negro');
  await page.getByRole('button', { name: 'Agregar S, M, L, XL' }).click();
  await page.getByLabel('Stock fila 2').fill('5'); // M
  await page.getByRole('button', { name: 'Publicar producto' }).click();
  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();

  // --- cupón
  await page.getByRole('link', { name: 'Cupones', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo cupon' }).click();
  await page.getByLabel('Codigo').fill(couponCode);
  await page.getByLabel('Tipo').selectOption('percent');
  await page.getByLabel('Porcentaje (%)').fill('10');
  await page.getByLabel('Compra minima (S/)').fill('100');
  await page.getByRole('button', { name: 'Crear', exact: true }).click();
  await expect(page.getByText(couponCode)).toBeVisible();

  // --- nuevo pedido
  await page.getByRole('link', { name: 'Ventas' }).click();
  await page.getByRole('link', { name: 'Nuevo pedido' }).click();
  await page.getByPlaceholder('Escribe para buscar un producto…').fill(productName);
  await page.getByRole('button', { name: /^M \/ Negro/ }).click();
  await page.getByLabel(new RegExp(`Cantidad de ${productName}`)).fill('2');
  await page.getByLabel('Nombre del cliente').fill('Cliente E2E');
  await page.getByLabel('Teléfono').fill('+51 900 000 000');
  await page.getByLabel('Codigo de descuento · opcional').fill(couponCode);
  await page.getByLabel('Adelanto recibido · S/ (vacío = 0)').fill('90.00');
  await page.getByRole('button', { name: 'Registrar y confirmar' }).click();

  // --- detalle: pedido confirmado, stock debe haber bajado en 2 (quedan 3)
  await expect(page.getByText('Confirmado').first()).toBeVisible();
  await expect(page.getByText(/^S\/ 180\.00/).first()).toBeVisible();

  // Monto inválido
  await page.getByLabel('Nuevo monto pagado total').fill('500');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('alert')).toContainText('total');

  // Pago correcto: queda en cero
  await page.getByLabel('Nuevo monto pagado total').fill('180');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Pagado').first()).toBeVisible();

  // Marcar entregado (doble click: confirma)
  await page.getByRole('button', { name: 'Marcar entregado' }).click();
  await page.getByRole('button', { name: 'Confirma de nuevo' }).click();
  await expect(page.getByText('Entregado').first()).toBeVisible();

  // Stock en la ficha pública: quedan 3
  const productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await page.goto(`/producto/${productSlug}`);
  await page.getByRole('button', { name: 'M', exact: true }).click();
  await expect(page.getByText('Quedan 3')).toBeVisible();

  // --- limpieza: ocultar producto (no se puede borrar porque tiene pedidos)
  await page.goto('/admin/productos');
  const del = page.getByRole('row', { name: new RegExp(productName) }).getByRole('button', { name: /Eliminar/ });
  await del.click();
  await del.click();
  await expect(page.getByRole('status')).toContainText('ocultó');

  // Limpieza del cupón
  await page.goto('/admin/cupones');
  const couponRow = page.getByRole('row', { name: new RegExp(couponCode) });
  page.once('dialog', (dialog) => void dialog.accept());
  const deleteResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/admin/coupons/') &&
      response.request().method() === 'DELETE',
  );
  await couponRow.getByRole('button', { name: 'Eliminar' }).click();
  await deleteResponse;
});
