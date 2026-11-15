# Browse and Search - automated tests

Playwright (TypeScript). Each test name starts with its ID from the test case table (TC-01a, TC-05b, ...).

## One-time setup
```
npm install
npx playwright install chromium msedge
```
Needs Node 18+ and the .NET 8 SDK.

## Check these two things first (assumptions I could not verify)
1. **Settings section name.** `playwright.config.ts` starts the app with `FileBrowser__RootPath` and
   `FileBrowser__MaxUploadBytes`. That assumes the section in `appsettings.json` is called `FileBrowser`.
   If it is called something else, change those two names.
2. **Path to the app.** The config runs `dotnet run --project ../TestProject`, so the folder holding
   `TestProject.csproj` must sit next to this folder. Otherwise set `APP_PROJECT` (for example
   `APP_PROJECT=../src/TestProject npm test`).

## Run
```
npm test            # API tests, then UI tests in Chromium and Edge
npm run test:api    # API tests only (fast)
npm run test:ui     # UI tests only
npm run report      # open the HTML report of the last run
```
The config starts the app itself, on port 5099, with a temporary home directory and `MaxUploadBytes = 1500`,
and stops it afterwards. Each test starts by emptying that directory, then creates exactly the files it needs.
That is why `workers` is 1: the tests share one home directory.

To test an app that is already running, set `BASE_URL`. Then you must start it with the same home directory
(`TEST_HOME`) and `MaxUploadBytes = 1500` yourself.

## Calibrating the upload boundary (TC-05)
The largest accepted file is the limit minus the multipart overhead, and the overhead depends on the client.
```
npm run calibrate
```
prints `LARGEST_ACCEPTED_FILE = <number>`. Put it in `tests/support/limits.ts`.
(`LARGEST_ACCEPTED_FILE=<number> npm run test:api` overrides it for one run.)
If TC-05a fails with a different status, or TC-05b gets 200, the number is wrong.

## Layout
```
playwright.config.ts          starts the app, defines the api / chromium / edge projects
tests/support/fixtures.ts     the `home` fixture: reset(), folder(), file(), names(), exists()
tests/support/limits.ts       MAX_UPLOAD_BYTES and LARGEST_ACCEPTED_FILE
tests/api/                    TC-01, TC-02, TC-03, TC-05
tests/ui/                     TC-04
tests/calibrate/              the bisection helper (not part of npm test)
```

## Known to confirm on the first real run
- TC-05b to d expect HTTP 413. If the app answers with another status, record the real one and update the table.
- TC-03d sends a null byte; confirm Kestrel passes it through to the app and the 400 message matches.
- TC-03b only runs on Windows.
