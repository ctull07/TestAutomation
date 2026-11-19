import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { deleteTestFile } from './data-clean-up';
import test from 'node:test';

const browser: Browser = await chromium.launch({ headless: false });
const page: Page = await browser.newPage();
const home = 'http://localhost:5120/browse/';

try {
    await test('Names sort by ascending order by default and descending when clicked', async () => {

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
    
}

finally {
    await browser.close();
}