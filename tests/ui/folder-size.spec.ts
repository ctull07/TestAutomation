import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';
import { test, expect } from '../support/fixtures';

// The server remembers a folder's size for 60 seconds, and emptying the test folder behind its back does not
// clear that memory. If two tests (or a retry, or a second run) used the same folder name, the second could
// be handed a size left over from the first. So every test gets a folder name nobody has used before.
const uniqueFolder = (prefix: string) => `/${prefix}-${randomUUID().slice(0, 8)}`;

const sizeOf = async (request: APIRequestContext, path: string) =>
    (await request.get('/api/files/size', { params: { path } })).json();

test.describe('API - Folder size (TC-11)', () => {
    test('TC-11a: A folder size covers everything below it', async ({ request, home }) => {
        const tree = uniqueFolder('Tree');
        home.file(`${tree}/a.bin`, 100);
        home.file(`${tree}/sub/b.bin`, 200);
        home.file(`${tree}/sub/deeper/c.bin`, 400);

        const response = await request.get('/api/files/size', { params: { path: tree } });

        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual({ path: tree, bytes: 700, files: 3, folders: 2 });
    });

    test('TC-11b: Folder size updates after an upload', async ({ request, home }) => {
        const growing = uniqueFolder('Growing');
        home.file(`${growing}/a.bin`, 100);
        home.file(`${growing}/sub/b.bin`, 200);
        expect(await sizeOf(request, growing)).toMatchObject({ bytes: 300, files: 2, folders: 1 }); // this read is remembered

        // Upload through the app, which is what makes it forget. Writing straight to the disk would not.
        const upload = await request.post('/api/files/upload', {
            params: { path: `${growing}/sub` },
            multipart: { file: { name: 'new.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(50, 'x') } },
        });
        expect(upload.status()).toBe(201);

        expect(await sizeOf(request, growing)).toMatchObject({ bytes: 350, files: 3, folders: 1 });
    });
});
