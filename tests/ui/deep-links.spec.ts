import { test, expect } from '../support/fixtures';
import { Page } from '@playwright/test';

const names = (page: Page) => page.getByTestId('entry-name').allTextContents();

test.describe('UI - Deep links (TC-04)', () => {
  test('TC-04a: Reloading a folder keeps the URL and listing', async ({ page, home }) => {
    home.file('/Projects/geo-data/map.txt', 10);
    home.file('/Projects/geo-data/notes.txt', 20);

    await page.goto('/browse/Projects/geo-data');
    const before = await (async () => {
      await expect(page.locator('.row')).toHaveCount(2);
    return names(page);
    })();

    await page.reload();

    await expect(page).toHaveURL(/\/browse\/Projects\/geo-data$/);
    await expect(page.locator('.crumbs')).toHaveText(/Home\s*\/\s*Projects\s*\/\s*geo-data/);
    await expect(page.locator('.row')).toHaveCount(2);
    expect(await names(page)).toEqual(before);
  });

  test('TC-04b: An invalid path shows the error and a way home', async ({ page }) => {
    await page.goto('/browse/NoReal/Path');

    await expect(page.locator('.message')).toContainText('404: Not found: /NoReal/Path');
    await expect(page.getByRole('link', { name: 'Go to Home' })).toBeVisible();
  });

  test('TC-04c: A path outside the home directory is refused', async ({ page, home }) => {
    home.file('/Documents/a.txt', 10);

    await page.goto('/browse/..%2Fsecret'); // %2F survives the browser's own tidying of "../"

    await expect(page.locator('.message')).toContainText('400: Path escapes the configured home directory');
    await expect(page.locator('.row')).toHaveCount(0);
  });
});
