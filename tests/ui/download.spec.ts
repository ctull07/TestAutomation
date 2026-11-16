import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import type { Download } from '@playwright/test';
import { test, expect } from '../support/fixtures';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** The files inside a downloaded ZIP: their names, and the total of their sizes. Folder entries are skipped. */
async function readZip(download: Download) {
  const zip = await JSZip.loadAsync(readFileSync(await download.path()));
  const files = Object.values(zip.files).filter(entry => !entry.dir);
  const sizes = await Promise.all(files.map(async entry => (await entry.async('uint8array')).length));
  return { names: files.map(entry => entry.name).sort(), totalBytes: sizes.reduce((a, b) => a + b, 0) };
}

test.describe('UI - Download (TC-07)', () => {
  test('TC-07a: Download a single file', async ({ page, home }) => {
    home.file('/Photos/panorama-sample.bin', 13);

    await page.goto('/browse/Photos');
    await page.getByRole('checkbox', { name: 'Select panorama-sample.bin' }).check();
    const downloading = page.waitForEvent('download'); // start listening before the click
    await page.getByRole('button', { name: 'Download (1)' }).click();
    const download = await downloading;

    expect(download.suggestedFilename()).toBe('panorama-sample.bin');
    const saved = readFileSync(await download.path());
    expect(saved.length).toBe(13);
    expect(sha256(saved)).toBe(sha256(home.read('/Photos/panorama-sample.bin'))); // same bytes as the original
  });

  test('TC-07b: Several files come back as one ZIP', async ({ page, home }) => {
    // Four files with known sizes: 100 + 200 + 300 + 700 = 1300 bytes
    home.file('/Uploads/a.bin', 100);
    home.file('/Uploads/b.bin', 200);
    home.file('/Uploads/c.bin', 300);
    home.file('/Uploads/d.bin', 700);

    await page.goto('/browse/Uploads');
    await page.getByRole('checkbox', { name: 'Select all' }).check();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download (4)' }).click();
    const download = await downloading;

    expect(download.suggestedFilename()).toBe('download.zip');
    const zip = await readZip(download);
    expect(zip.names).toEqual(['a.bin', 'b.bin', 'c.bin', 'd.bin']);
    expect(zip.totalBytes).toBe(1300); // the files inside add up; the ZIP itself is a different size
  });

  test('TC-07c: A folder comes back as a ZIP named after it', async ({ page, home }) => {
    home.file('/Uploads/a.bin', 100);
    home.file('/Uploads/b.bin', 200);
    home.file('/Uploads/c.bin', 300);
    home.file('/Uploads/d.bin', 700);

    await page.goto('/browse');
    await page.getByRole('checkbox', { name: 'Select Uploads' }).check();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download (1)' }).click();
    const download = await downloading;

    expect(download.suggestedFilename()).toBe('Uploads.zip');
    const zip = await readZip(download);
    expect(zip.names).toEqual(['Uploads/a.bin', 'Uploads/b.bin', 'Uploads/c.bin', 'Uploads/d.bin']); // under an Uploads/ prefix
    expect(zip.totalBytes).toBe(1300);
  });
});
