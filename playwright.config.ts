import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MAX_UPLOAD_BYTES } from './tests/support/limits';

// The app's home directory for the whole run. `??=` matters: the config file is loaded again in every worker,
// and the workers must see the folder the main process created, not make a new one.
const home = (process.env.TEST_HOME ??= mkdtempSync(join(tmpdir(), 'browse-tests-')));

const port = process.env.PORT ?? '5099';

const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`;

// Set BASE_URL to test an app that is already running. Then YOU must start it with the same home folder
// setting (TEST_HOME) and MaxUploadBytes, or the tests will not find their files.
const startApp = !process.env.BASE_URL;

export default defineConfig({
    testDir: './tests',
    // One worker, because every test shares the one home directory and starts by emptying it.
    workers: 1,
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL,
        ignoreHTTPSErrors: true, // the local https dev certificate is not trusted
        trace: 'retain-on-failure',
    },
    webServer: startApp
        ? {
            // Path to the folder that holds TestProject.csproj, relative to this file.
            command: `dotnet run --project "${process.env.APP_PROJECT ?? '../TestProject'}" --no-launch-profile`,
            url: baseURL,
            timeout: 120_000,
            reuseExistingServer: false,
            env: {
                ASPNETCORE_URLS: baseURL,
                ASPNETCORE_ENVIRONMENT: 'Development',
                FileBrowser__RootPath: home,
                FileBrowser__MaxUploadBytes: String(MAX_UPLOAD_BYTES),
            },
        }
        : undefined,
    projects: [
        { name: 'api', testDir: './tests/api' },
        { name: 'chromium', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
        { name: 'edge', testDir: './tests/ui', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
        { name: 'noFrame', testDir: './tests/ui/free', use: { ...devices['Desktop Edge'] } },
        { name: 'calibrate', testDir: './tests/calibrate' },
    ],
});
