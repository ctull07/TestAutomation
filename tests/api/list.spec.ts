import { test, expect } from '../support/fixtures';

test.describe('API - List and search (TC-01, TC-02)', () => {

    test('TC-01a: List the home directory', async ({ request, home }) => {
    // Precondition: home has 3 folders and 4 files totaling 1300 bytes
    for (const folder of ['Documents', 'Photos', 'Projects']) home.folder(folder);
    home.file('a.txt', 100);
    home.file('b.txt', 200);
    home.file('c.txt', 400);
    home.file('d.txt', 600);

    const apiResponse = await request.get('/api/files', { params: { path: '/' } });

    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.path).toBe('/');
    expect(body.parent).toBeNull();
    expect(body.entries.map((entry: { name: string }) => entry.name)).toEqual([
      'Documents', 'Photos', 'Projects', 'a.txt', 'b.txt', 'c.txt', 'd.txt',
    ]);
    expect(body.totals).toEqual({ folders: 3, files: 4, bytes: 1300 });
  });


  test('TC-01b: List a subfolder', async ({ request, home }) => {
    home.file('/Documents/Reports/file1.txt', 10);
    home.file('/Documents/Reports/file2.txt', 20);

    const apiResponse = await request.get('/api/files', { params: { path: '/Documents/Reports' } });

    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.path).toBe('/Documents/Reports');
    expect(body.parent).toBe('/Documents');
    expect(body.entries).toHaveLength(2);
    expect(body.entries.every((entry: { type: string }) => entry.type === 'file')).toBe(true);
  });


  test('TC-01c: Search is recursive and case-insensitive', async ({ request, home }) => {
    home.file('/Documents/Reports/budget-forecast.csv', 50);
    home.file('/Documents/Reports/other.txt', 50);

    const apiResponse = await request.get('/api/files', { params: { q: 'BUDGET' } });

    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.entries.map((entry: { path: string }) => entry.path)).toEqual(['/Documents/Reports/budget-forecast.csv']);
  });


  test('TC-02: List a folder that does not exist', async ({ request }) => {
    const apiResponse = await request.get('/api/files', { params: { path: '/NoReal/Path' } });

    expect(apiResponse.status()).toBe(404);
    expect((await apiResponse.json()).title).toBe('Not found: /NoReal/Path');
  });
});
