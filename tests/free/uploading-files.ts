import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { deleteTestFile } from './data-clean-up';

const browser: Browser = await chromium.launch({ headless: false });
const page: Page = await browser.newPage();
const home = 'http://localhost:5120/browse/';

try {
// Test: Upload a file with the same name as an existing file in a different directory
    await page.goto(`${ home }Documents`);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload' }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles('sampleFolder/sample.txt');
    await page.getByText('sample.txt').waitFor();

    await page.goto(`${ home }Photos`);

    const fileChooserPromise2 = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload' }).click();
    const fileChooser2 = await fileChooserPromise2;

    await fileChooser2.setFiles('sampleFolder/sample.txt');
    await page.getByText('sample.txt').waitFor();
    console.log('PASS: Successfully uploaded files with the same name in different directories');
}
catch (error: any) {
    const cleanMessage = error.message.split('\n')[0];
    console.error(cleanMessage);
    process.exitCode = 1;
}
finally {
    await deleteTestFile(page, `${ home }Photos`, 'sample.txt');
    await deleteTestFile(page, `${ home }Documents`, 'sample.txt');

    await browser.close();
}