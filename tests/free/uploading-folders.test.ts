import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { deleteTestFile } from '../support/data-clean-up';

let browser: Browser;
let page: Page;
let home = 'http://localhost:5120/browse/';

before(async () => {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
});

after(async () => {
    await deleteTestFile(page, `${home}Documents`, 'sample.txt');
    await browser.close();
});

    await test('TC-06c: A user is restricted to only uploading files'), async () => {
        await page.goto(home);

        // Perform user actions
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'Upload' }).click();
        const fileChooser = await fileChooserPromise;

        // Verify the file input is NOT configured to pick folders
        const inputElement = fileChooser.element();
        const isDirectoryPicker = await inputElement.evaluate((element: HTMLInputElement) => {
            return element.hasAttribute('webkitdirectory') || element.hasAttribute('directory');
        });
        assert.equal(isDirectoryPicker, false, 'FAIL: Expected upload button to only allow files, not folders');

        // Test uploading an actual file
        await fileChooser.setFiles('sampleFolder/sample.txt');

        await page.getByText('sample.txt').waitFor();
        console.log('PASS: Upload button restricts selection to files and accepts valid file uploads');
    }