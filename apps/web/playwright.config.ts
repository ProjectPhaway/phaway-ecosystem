import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra los servidores locales (pnpm dev). Requiere API + Postgres encendidos.
 * Credenciales: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /public\.spec\.ts/ },
  ],
});
