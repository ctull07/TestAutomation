import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { parseSizeToBytes, formatBytes } from '../support/byte-conversion';
import { before, after, test } from 'node:test';

let browser: Browser;
let page: Page;
let home = 'http://localhost:5120/browse/';

before(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
});

after(async () => {
    await browser.close();
});

    test('TC-14: Selecting all folders and files', async () => {
        await page.goto(`${home}`);

        const selectAll = page.getByRole('checkbox', { name: 'Select all' });

        await selectAll.check();
        assert.ok(await selectAll.isChecked(), 'Select all checkbox is not checked');

        // Locate all rows that currently have a checked checkbox
        const selectedRows = page.locator('.row:has(input[type="checkbox"][data-select]:checked)');
        const selectedCount = await selectedRows.count();

        let totalBytes = 0;

        for (let i = 0; i < selectedCount - 1; i++) {
            // Grab the exact size text (e.g., "37 B", "3.0 MB") from the size span
            const sizeText = await selectedRows.nth(i).locator('[data-size-path]').innerText();
            totalBytes += await parseSizeToBytes(sizeText);
        }

        const expectedTotalSize = await formatBytes(totalBytes);
        const expectedSummary = `${selectedCount} selected (${expectedTotalSize})`;

        // Assert against the summary element
        const selectedInfo = page.locator('.selected-info');
        assert.equal(await selectedInfo.innerText(), expectedSummary, `Expected summary text: "${expectedSummary}", but got: "${await selectedInfo.innerText()}"`);

        // Verify action buttons are enabled
        assert.ok(await page.getByRole('button', { name: 'Download' }).isEnabled());
        assert.ok(await page.getByRole('button', { name: 'Copy to...' }).isEnabled());
        assert.ok(await page.getByRole('button', { name: 'Move to...' }).isEnabled());
        assert.ok(await page.getByRole('button', { name: 'Delete' }).isEnabled());

    }); 
