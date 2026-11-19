import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { deleteTestFile } from './data-clean-up';

const browser: Browser = await chromium.launch({ headless: true });
const page: Page = await browser.newPage();
const home = 'http://localhost:5120/browse/';

// Test: A user is restricted to only uploading files and cannot upload folders using the upload button. 
try {
    
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
catch (error: any) {
    const cleanMessage = error.message.split('\n')[0];
    console.error(cleanMessage);
    process.exitCode = 1;
}
finally {
    await deleteTestFile(page, `${ home }Documents`, 'sample.txt');
    await browser.close();
}