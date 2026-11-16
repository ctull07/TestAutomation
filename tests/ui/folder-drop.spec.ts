import { test, expect } from '../support/fixtures';

test.describe('UI - Dropping a folder (TC-06)', () => {
  test('TC-06: A dropped folder is rejected with a notice and nothing is uploaded', async ({ page, home }) => {
    // Precondition: the home directory holds one file, so "unchanged" means something
    home.file('/existing.txt', 10);
    const uploadRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/files/upload')) uploadRequests.push(request.url());
    });

    await page.goto('/browse');
    await expect(page.getByTestId('entry-name')).toHaveText(['existing.txt']);

    // A real folder cannot be dragged in from a test, so build the drop event by hand.
    // It carries one item that says "I am a directory", which is what a browser reports for a dropped folder.
    await page.locator('.viewport').evaluate(viewport => {
      const drop = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(drop, 'dataTransfer', {
        value: {
          types: ['Files'],
          items: [{ kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true }), getAsFile: () => null }],
        },
      });
      viewport.dispatchEvent(drop);
    });

    await expect(page.locator('.notice')).toHaveText('Folders cannot be uploaded. Only the files you dropped were sent.');
    expect(uploadRequests).toEqual([]); // no upload was even attempted
    expect(home.names('/')).toEqual(['existing.txt']); // nothing new on disk
    await expect(page.getByTestId('entry-name')).toHaveText(['existing.txt']); // listing unchanged
  });
});
