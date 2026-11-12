import { expect, test } from '@playwright/test';

test('inicio carga con hero, categorías y CTA de WhatsApp', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pasión');
  await expect(page.getByRole('heading', { name: 'Compra por tipo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Escríbenos por WhatsApp' })).toHaveAttribute(
    'href',
    /wa\.me\/51965769340/,
  );
});

test('navegación a Liquidación, Personalizados y 404', async ({ page }) => {
  await page.goto('/liquidacion');
  await expect(page.getByRole('heading', { level: 1, name: 'Liquidación' })).toBeVisible();
  await page.goto('/personalizados');
  await expect(page.getByRole('heading', { name: 'Trabajos recientes' })).toBeVisible();
  await page.goto('/no-existe');
  await expect(page.getByText('Página no encontrada')).toBeVisible();
});

test('rutas admin sin sesión redirigen al login', async ({ page }) => {
  await page.goto('/admin/productos');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});
