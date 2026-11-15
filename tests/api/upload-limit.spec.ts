import { test, expect } from '../support/fixtures';
import { BOUNDARY_FILE_NAME, LARGEST_ACCEPTED_FILE, MAX_UPLOAD_BYTES } from '../support/limits';
import type { APIRequestContext } from '@playwright/test';

/** One upload, sent the same way every time so the overhead (and so the boundary) stays the same. */
function upload(request: APIRequestContext, bytes: number) {
  return request.post('/api/files/upload', {
    params: { path: '/Uploads' },
    multipart: {
      file: { name: BOUNDARY_FILE_NAME, mimeType: 'application/octet-stream', buffer: Buffer.alloc(bytes, 'x') },
    },
  });
}

test.describe(`API - Upload limit (TC-05), MaxUploadBytes = ${MAX_UPLOAD_BYTES}`, () => {
  test.beforeEach(({ home }) => home.folder('/Uploads')); // empty /Uploads for every test

  test(`TC-05a: Largest accepted size (${LARGEST_ACCEPTED_FILE} bytes) uploads`, async ({ request, home }) => {
    const response = await upload(request, LARGEST_ACCEPTED_FILE);

    expect(response.status()).toBe(201);
    expect((await response.json()).size).toBe(LARGEST_ACCEPTED_FILE);

    const listing = await (await request.get('/api/files', { params: { path: '/Uploads' } })).json();
    expect(listing.entries).toHaveLength(1);
    expect(listing.entries[0]).toMatchObject({ name: BOUNDARY_FILE_NAME, size: LARGEST_ACCEPTED_FILE });
    expect(home.names('/Uploads')).toEqual([BOUNDARY_FILE_NAME]);
  });

  // 05b: one byte over the largest accepted. 05c: exactly the limit. 05d: one over the limit.
  const rejected = [
    { id: 'TC-05b', name: 'One byte over the largest accepted', bytes: LARGEST_ACCEPTED_FILE + 1 },
    { id: 'TC-05c', name: 'Exactly the limit', bytes: MAX_UPLOAD_BYTES },
    { id: 'TC-05d', name: 'Limit + 1', bytes: MAX_UPLOAD_BYTES + 1 },
  ];

  for (const c of rejected) {
    test(`${c.id}: ${c.name} (${c.bytes} bytes) is rejected`, async ({ request, home }) => {
      const response = await upload(request, c.bytes);
     
      expect(response.status()).toBe(413);
      expect(home.names('/Uploads')).toEqual([]);
    });
  }
});
