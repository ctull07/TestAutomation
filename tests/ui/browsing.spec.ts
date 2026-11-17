import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';

const breadcrumb = (page: Page) => page.getByRole('navigation', { name: 'Breadcrumb' });

test.describe('UI - browsing (TC-09)', () => {
    test('TC-09a clicking a folder opens it', async ({ page, home }) => {
        home.folder('/Documents/Reports');

        await page.goto('/browse');
        await page.getByRole('link', { name: 'Documents' }).click();

        await expect(page).toHaveURL(/\/browse\/Documents$/);
        await expect(breadcrumb(page)).toHaveText(/^Home\s*\/\s*Documents$/);
    });

    test('TC-09b clicking a breadcrumb goes back up', async ({ page, home }) => {
        home.file('/Documents/Reports/q1.txt', 10);

        await page.goto('/browse/Documents/Reports');
        await page.getByRole('link', { name: 'Home' }).click();

        await expect(page).toHaveURL(/\/browse$/);
        await expect(breadcrumb(page)).toHaveText(/^Home$/);
    });

    test("TC-09c the browser's back button returns to the previous folder", async ({ page, home }) => {
        home.folder('/Documents/Reports');

        // Click through the app, so the browser's history has entries to go back to
        await page.goto('/browse');
        await page.getByRole('link', { name: 'Documents' }).click();
        await page.getByRole('link', { name: 'Reports' }).click();
        await expect(page).toHaveURL(/\/browse\/Documents\/Reports$/);

        await page.goBack();

        await expect(page).toHaveURL(/\/browse\/Documents$/);
        await expect(breadcrumb(page)).toHaveText(/^Home\s*\/\s*Documents$/);
    });

    test("TC-09d the browser's forward button returns to the next folder", async ({ page, home }) => {
        home.folder('/Documents/Reports');

        await page.goto('/browse');
        await page.getByRole('link', { name: 'Documents' }).click();
        await page.getByRole('link', { name: 'Reports' }).click();
        await page.goBack();
        await expect(page).toHaveURL(/\/browse\/Documents$/);

        await page.goForward();

        await expect(page).toHaveURL(/\/browse\/Documents\/Reports$/);
        await expect(breadcrumb(page)).toHaveText(/^Home\s*\/\s*Documents\s*\/\s*Reports$/);
    });

    test("TC-09e: The browser's refresh button returns the same URL", async ({ page, home }) => {
        home.folder('/Documents/Reports');

        await page.goto('/browse');
        await page.getByRole('link', { name: 'Documents' }).click();
        await page.getByRole('link', { name: 'Reports' }).click();
        await page.reload();

        await expect(page).toHaveURL(/\/browse\/Documents\/Reports$/);
        await expect(breadcrumb(page)).toHaveText(/^Home\s*\/\s*Documents\s*\/\s*Reports$/);
    });

    test('TC-09f an empty folder says so', async ({ page, home }) => {
        home.folder('/Empty');

        await page.goto('/browse/Empty');

        await expect(page.locator('.message')).toContainText('This folder is empty');
        await expect(page.locator('.message')).toContainText('Upload files, or drop them here.');
    });
});
