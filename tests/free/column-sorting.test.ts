import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';

let browser: Browser;
let page: Page;
let home = 'http://localhost:5120/browse/';

before(async () => {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
});

after(async () => {
    await browser.close();
});


await test('TC-13: Names sort by ascending order by default and descending when clicked', async () => {

    await page.goto(`${home}`);

    const nameHeader = page.getByRole('button', { name: 'NAME' });
    const nameCells = page.locator('tbody tr td:nth-child(1)');

    //await nameHeader.click();
    const actualAsc = (await nameCells.allInnerTexts()).map((text) => text.trim());
    const expectedAsc = [...actualAsc].sort((a, b) => a.localeCompare(b));


    assert.deepEqual(actualAsc, expectedAsc);

    // 2. Click again -> Verify Descending Order (Z -> A)
    await nameHeader.click();
    const actualDesc = (await nameCells.allInnerTexts()).map((text) => text.trim());
    const expectedDesc = [...actualDesc].sort((a, b) => b.localeCompare(a));

    assert.deepEqual(actualDesc, expectedDesc);
});