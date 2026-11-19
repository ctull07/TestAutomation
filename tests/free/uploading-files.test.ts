import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { deleteTestFile } from './data-clean-up';
import test from 'node:test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const browser: Browser = await chromium.launch({ headless: false });
const page: Page = await browser.newPage();
const home = 'http://localhost:5120/browse/';

try {
    await test('both directories list the same file name', async () => {

        await page.goto(`${home}Documents`);

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'Upload' }).click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles('sampleFolder/sample.txt');
        await page.getByText('sample.txt').waitFor();

        await page.goto(`${home}Photos`);

        const fileChooserPromise2 = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'Upload' }).click();
        const fileChooser2 = await fileChooserPromise2;
        await fileChooser2.setFiles('sampleFolder/sample.txt');
        await page.getByText('sample.txt').waitFor();

        console.log('PASS: Successfully uploaded files with the same name in different directories');
    });


    test('API rejects file names with forbidden characters', async () => {
        // 1. Build a multipart/form-data payload with an invalid file name
        const formData = new FormData();
        const fakeFile = new Blob(['test content'], { type: 'text/plain' });
        formData.append('file', fakeFile, 'invalid:name.txt');

        // 2. Send a POST request directly to your upload API endpoint
        const response = await fetch('https://localhost:7146/api/files/upload', {
            method: 'POST',
            body: formData,
        });

        assert.equal(response.status, 400);
        assert.equal((await response.json()).title, 'Invalid file name');
    });

    test('API rejects file names with 255 characters', async () => {
        const formData = new FormData();
        const fakeFile = new Blob(['test content'], { type: 'text/plain' });
        formData.append('file', fakeFile, 'a'.repeat(256) + '.txt');

        const response = await fetch('https://localhost:7146/api/files/upload', {
            method: 'POST',
            body: formData,
        });
        assert.equal(response.status, 400);
        assert.equal((await response.json()).title, 'Invalid file name');
    });
}

finally {
    await deleteTestFile(page, `${ home }Photos`, 'sample.txt');
    await deleteTestFile(page, `${ home }Documents`, 'sample.txt');

    await browser.close();
}