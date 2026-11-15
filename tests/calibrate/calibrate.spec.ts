import { test } from '../support/fixtures';
import { BOUNDARY_FILE_NAME, MAX_UPLOAD_BYTES } from '../support/limits';

// Finds the largest file the server accepts, by bisection, using the same client and file name as the real tests.
// Not part of `npm test`. Run it with `npm run calibrate` and copy the number into tests/support/limits.ts.
test('calibrate the largest accepted upload size', async ({ request, home }) => {
  home.folder('/Calibrate');
  const accepted = async (bytes: number) =>
    (
      await request.post('/api/files/upload', {
        params: { path: '/Calibrate' },
        multipart: {
          file: { name: BOUNDARY_FILE_NAME, mimeType: 'application/octet-stream', buffer: Buffer.alloc(bytes, 'x') },
        },
      })
    ).status() === 201;

  if (!(await accepted(0))) throw new Error('An empty file was rejected, so something else is wrong');
  if (await accepted(MAX_UPLOAD_BYTES)) throw new Error(`A file of ${MAX_UPLOAD_BYTES} bytes was accepted, so the limit is not ${MAX_UPLOAD_BYTES}`);

  let low = 0; // accepted
  let high = MAX_UPLOAD_BYTES; // rejected
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (await accepted(mid)) low = mid;
    else high = mid;
  }
  console.log(`\nLARGEST_ACCEPTED_FILE = ${low}   (the multipart overhead is ${MAX_UPLOAD_BYTES - low} bytes)\n`);
});
