import type { APIRequestContext } from '@playwright/test';
import { test, expect } from '../support/fixtures';

/** Uploads one file with the given name into a folder. */
function upload(request: APIRequestContext, folder: string, name: string, bytes = 10) {
    return request.post('/api/files/upload', {
        params: { path: folder },
        multipart: { file: { name, mimeType: 'application/octet-stream', buffer: Buffer.alloc(bytes, 'x') } },
    });
}

test.describe('API - file and folder names (TC-10)', () => {
    test('TC-10a: A name that is already taken gets a number', async ({ request, home }) => {
        home.file('/Uploads/a.txt', 5); // the original, 5 bytes

        const res = await upload(request, '/Uploads', 'a.txt', 10); // the new one, 10 bytes

        expect(res.status()).toBe(201);
        expect((await res.json()).name).toBe('a (1).txt');
        expect(home.names('/Uploads')).toEqual(['a (1).txt', 'a.txt']);
        expect(home.read('/Uploads/a.txt').length).toBe(5); // the original is untouched
    });

    test('TC-10b: A file named like an existing folder gets a number', async ({ request, home }) => {
        home.folder('/Documents');

        const res = await upload(request, '/', 'Documents'); // no extension, so the name matches the folder exactly

        expect(res.status()).toBe(201);
        expect((await res.json()).name).toBe('Documents (1)');
        expect(home.names('/')).toEqual(['Documents', 'Documents (1)']); // the folder is still there
    });

    test('TC-10d: A reserved name is rejected', async ({ request, home }) => {
        home.folder('/Uploads');

        const res = await upload(request, '/Uploads', 'CON.txt'); // CON is a device name on Windows

        expect(res.status()).toBe(400);
        expect((await res.json()).title).toBe('Invalid file name');
        expect(home.names('/Uploads')).toEqual([]); // nothing was created
    });

    test('TC-10f: A name with special characters is kept as it is', async ({ request, home }) => {
        home.folder('/Uploads');

        const res = await upload(request, '/Uploads', 'test&test.txt');

        expect(res.status()).toBe(201);
        expect((await res.json()).name).toBe('test&test.txt');
        expect(home.names('/Uploads')).toEqual(['test&test.txt']);
    });
});
