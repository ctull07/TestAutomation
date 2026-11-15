import { test, expect } from '../support/fixtures';

// The following tests assert requests that try to leave the home directory, or use characters the server refuses.
// Playwright encodes `params`, so "\" is sent as %5C and the null character as %00.
const rejected = [
  { id: 'TC-03a', name: 'parent traversal', path: '/../secrets', title: 'Path escapes the configured home directory', windowsOnly: false },
  { id: 'TC-03b', name: 'rooted segment', path: 'C:', title: 'Path escapes the configured home directory', windowsOnly: true },
  { id: 'TC-03c', name: 'backslash variant', path: '/..\\secrets', title: 'Path escapes the configured home directory', windowsOnly: false },
  { id: 'TC-03d', name: 'null byte', path: '/\u0000', title: 'Path contains invalid characters', windowsOnly: false },
];

test.describe('API - Path safety (TC-03)', () => {
  for (const c of rejected) {
    test(`${c.id}: ${c.name} is rejected`, async ({ request, home }) => {
      test.skip(c.windowsOnly && process.platform !== 'win32', 'A drive letter is only a rooted path on Windows');
      home.folder('/Documents'); // something exists, so a wrong answer could have leaked a listing

      const response = await request.get('/api/files', { params: { path: c.path } });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.title).toBe(c.title);
      expect(body.entries).toBeUndefined(); // no listing came back
    });
  }

  test('TC-03e: Pointing at a file is rejected', async ({ request, home }) => {
    home.file('/Documents/Contracts/vendor-agreement.txt', 10);

    const response = await request.get('/api/files', { params: { path: '/Documents/Contracts/vendor-agreement.txt' } });

    expect(response.status()).toBe(400);
    expect((await response.json()).title).toBe('Not a folder: /Documents/Contracts/vendor-agreement.txt');
  });
});
