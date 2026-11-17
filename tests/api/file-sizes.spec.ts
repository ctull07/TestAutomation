import { test, expect } from '../support/fixtures';

type Entry = { name: string; type: string; size: number | null };

test.describe('API - File sizes and totals (TC-12)', () => {
    test('TC-12a: Every file reports its exact size, and a folder has none', async ({ request, home }) => {
        home.file('/Files/zero.bin', 0);
        home.file('/Files/one.bin', 1);
        home.file('/Files/big.bin', 1000);
        home.folder('/Files/Sub');

        const response = await request.get('/api/files', { params: { path: '/Files' } });

        expect(response.status()).toBe(200);
        const entries: Entry[] = (await response.json()).entries;
        const sizeOf = (name: string) => entries.find(entry => entry.name === name)?.size;
        expect(sizeOf('zero.bin')).toBe(0);
        expect(sizeOf('one.bin')).toBe(1);
        expect(sizeOf('big.bin')).toBe(1000);
        expect(sizeOf('Sub')).toBeNull(); // a folder's size comes from the size endpoint, not the listing
    });

    test('TC-12b: The totals count only what is directly in the folder', async ({ request, home }) => {
        home.file('/Counts/a.txt', 100);
        home.file('/Counts/b.txt', 200);
        home.file('/Counts/Sub/c.txt', 500); // inside a subfolder, so not part of this view's file bytes

        const body = await (await request.get('/api/files', { params: { path: '/Counts' } })).json();

        expect(body.totals).toEqual({ folders: 1, files: 2, bytes: 300 });
    });

    test('TC-12c: An empty folder has zero totals', async ({ request, home }) => {
        home.folder('/Nothing');

        const body = await (await request.get('/api/files', { params: { path: '/Nothing' } })).json();

        expect(body.entries).toEqual([]);
        expect(body.totals).toEqual({ folders: 0, files: 0, bytes: 0 });
    });

    test('TC-12d: Search totals cover the matches only', async ({ request, home }) => {
        home.file('/Docs/report-q1.txt', 100);
        home.file('/Docs/Sub/report-q2.txt', 200); // found because search looks below the folder
        home.file('/Docs/other.txt', 400); // not a match, so not counted

        const body = await (await request.get('/api/files', { params: { path: '/', q: 'report' } })).json();

        expect(body.totals).toEqual({ folders: 0, files: 2, bytes: 300 });
    });
});
