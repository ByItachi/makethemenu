import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Pages to test
const PAGES = [
  '/',
  '/giris',
  '/kayit',
  '/sablonlar',
  '/sablon-demo/chinese-restaurant',
  '/sablon-demo/vegan-menu',
  '/sablon-demo/food-truck',
  '/admin',
  '/admin/templates',
  '/admin/demos',
  '/admin/businesses',
];

test.describe('Console Errors and Network Failures', () => {
  PAGES.forEach((page) => {
    test(`${page} - no console errors`, async ({ page: browserPage }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: { url: string; status: number }[] = [];

      // Capture console errors
      browserPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Capture page errors
      browserPage.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });

      // Capture failed requests
      browserPage.on('requestfailed', (request) => {
        failedRequests.push({
          url: request.url(),
          status: request.failure()?.errorText || 'unknown'
        } as any);
      });

      // Navigate to page
      const response = await browserPage.goto(`${BASE_URL}${page}`, {
        waitUntil: 'networkidle'
      });

      // Wait for page to settle
      await browserPage.waitForTimeout(1000);

      // Check for errors
      expect(consoleErrors, `Console errors on ${page}`).toEqual([]);
      expect(pageErrors, `Page errors on ${page}`).toEqual([]);
      expect(failedRequests, `Failed requests on ${page}`).toEqual([]);
      expect(response?.status(), `HTTP status on ${page}`).toBeLessThan(400);
    });
  });
});

test.describe('Responsive Design', () => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile (iPhone SE)' },
    { width: 375, height: 667, name: 'Mobile (iPhone 8)' },
    { width: 390, height: 844, name: 'Mobile (iPhone 12)' },
    { width: 768, height: 1024, name: 'Tablet (iPad)' },
    { width: 1024, height: 768, name: 'Tablet (iPad Landscape)' },
    { width: 1440, height: 900, name: 'Desktop' },
  ];

  viewports.forEach(({ width, height, name }) => {
    test(`${name} (${width}x${height}) - no errors`, async ({ page: browserPage }) => {
      browserPage.setViewportSize({ width, height });

      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      browserPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      browserPage.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });

      // Test main page
      await browserPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await browserPage.waitForTimeout(1000);

      expect(consoleErrors, `Console errors on ${name}`).toEqual([]);
      expect(pageErrors, `Page errors on ${name}`).toEqual([]);
    });
  });
});
