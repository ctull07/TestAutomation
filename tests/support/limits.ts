// Upload limit used by the tests. The config starts the app with this MaxUploadBytes.
export const MAX_UPLOAD_BYTES = 1300;

// The largest FILE the server accepts when sent with Playwright's API client and the file name "boundary.bin".
// The server limit applies to the whole request, so this is MAX_UPLOAD_BYTES minus the multipart overhead.
// Find it by running `npm run calibrate` (see README), then paste the number here.
// The LARGEST_ACCEPTED_FILE environment variable overrides it, which is handy while calibrating.
export const LARGEST_ACCEPTED_FILE = Number(process.env.LARGEST_ACCEPTED_FILE ?? 1100);

// Keep this name for every boundary test: the name is part of the request, so a longer name changes the overhead.
export const BOUNDARY_FILE_NAME = 'boundary.bin';
