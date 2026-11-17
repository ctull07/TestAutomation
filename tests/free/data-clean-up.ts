import { chromium, type Browser, type Page } from 'playwright';

export async function deleteTestFile(page: Page, url: string, fileName: string) {
    await page.goto(url);
    const checkbox = page.getByRole('checkbox', { name: `Select ${fileName}` });

    // Only attempt to delete if the file actually exists on the page
    if (await checkbox.isVisible()) {
        await checkbox.check();
        await page.getByTestId('delete-button').click();
        await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
        await checkbox.waitFor({ state: 'detached' }); // Wait until deletion finishes
    }
}
