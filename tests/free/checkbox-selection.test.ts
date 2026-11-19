import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { deleteTestFile } from './data-clean-up';
import test from 'node:test';
import { expect } from '../support/fixtures';
import { fail } from 'assert';

const browser: Browser = await chromium.launch({ headless: false });
const page: Page = await browser.newPage();
const home = 'http://localhost:5120/browse/';

try {
    // test('Selecting all folders and files'), async () => {
    await page.goto(`${home}Documents`);

    

    const selectAll = await page.getByRole('checkbox', { name: 'Select all' });

    await selectAll.check();
    assert.ok(await selectAll.isChecked(), 'Select all checkbox is not checked');

    // 2. Grab all individual folder and file checkboxes using your HTML attributes
    const rowCheckboxes = page.locator('.row input[type="checkbox"][data-select]');
    const count = await rowCheckboxes.count();

    assert.ok(count > 0, 'Expected at least one folder or file row to verify');

    // 3. Loop through every row and verify its checkbox is checked
    for (let i = 0; i < count; i++) {
        const checkbox = rowCheckboxes.nth(i);
        const itemPath = await checkbox.getAttribute('data-path');
        const isChecked = await checkbox.isChecked();

        assert.equal(isChecked, true, `Row checkbox for "${itemPath}" is not checked`);
    }
    const selectedInfo = await page.getByRole('status', { name: 'Selected info' }).innerText();
    assert.equal(selectedInfo.trim(), '10 Selected (3.0 MB)');

    
    }

finally {
    await browser.close();
    }