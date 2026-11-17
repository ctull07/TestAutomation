import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';

const names = (page: Page) => page.getByTestId('entry-name');
const searchBox = (page: Page) => page.getByRole('searchbox', { name: 'Search files and folders' });

test.describe('UI - Search files and folders (TC-08)', () => {
  test('TC-08a: Search for an existing file', async ({ page, home }) => {
    home.file('/Uploads/boundary.bin', 10);

    await page.goto('/browse');
    await searchBox(page).fill('boundary.bin');

    await expect(names(page)).toHaveText(['boundary.bin']);
  });

  test('TC-08b: Search for an existing folder', async ({ page, home }) => {
    home.folder('/Projects/geo-data');

    await page.goto('/browse');
    await searchBox(page).fill('geo-data');

    await expect(names(page)).toHaveText(['geo-data']);
  });

  test('TC-08c: A search with no matches says so', async ({ page, home }) => {
    home.file('/existing.txt', 10);

    await page.goto('/browse');
    await searchBox(page).fill('not-real.txt');

    await expect(page.locator('.message')).toContainText('No matches for “not-real.txt”'); // the page uses curly quotes
    await expect(page.locator('.message')).toContainText('Searched / and everything below it.');
    await expect(names(page)).toHaveCount(0);
  });

  test('TC-08d: Search is partial and recursive, and stays below the current folder', async ({ page, home }) => {
    home.file('/Documents/Contracts/vendor-agreement.txt', 10); // inside a subfolder of /Documents
    home.file('/Projects/agree.txt', 10); // outside /Documents, so it must not appear

    await page.goto('/browse/Documents');
    await searchBox(page).fill('agree');

      await expect(names(page)).toHaveText(['vendor-agreement.txt']);
      await expect(names(page)).not.toContainText(['agree.txt']); // the other file is outside /Documents, so it must not appear)).toNot
  });

  test('TC-08e: Search ignores upper and lower case', async ({ page, home }) => {
    home.file('/Uploads/boundary.bin', 10);

    await page.goto('/browse');
    await searchBox(page).fill('BO');

    await expect(names(page)).toHaveText(['boundary.bin']);
    await expect(page).toHaveURL(/\/browse\?q=BO$/);
  });

  test('TC-08f: Clearing the search restores the folder', async ({ page, home }) => {
    home.file('/Documents/Contracts/vendor-agreement.txt', 10);
    home.file('/Documents/Reports/budget-forecast.csv', 10);

    await page.goto('/browse/Documents');
    await searchBox(page).fill('agree');
    await expect(names(page)).toHaveText(['vendor-agreement.txt']);

    await searchBox(page).fill('');

    await expect(names(page)).toHaveText(['Contracts', 'Reports']);
    await expect(page).not.toHaveURL(/q=/);
  });

  test('TC-08g: A % in the search text works and is encoded in the URL', async ({ page, home }) => {
    home.file('/Documents/Reports/99%-done.txt', 10);

    await page.goto('/browse');
    await searchBox(page).fill('%');

    await expect(names(page)).toHaveText(['99%-done.txt']);
    await expect(page).toHaveURL(/\/browse\?q=%25$/);
  });
});
