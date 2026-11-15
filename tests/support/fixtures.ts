import { test as base, expect } from '@playwright/test';
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * The app's home directory, as the tests see it on disk. Paths are written the way the app shows them
 * ("/Documents/Reports/a.txt"), without the real folder in front.
 */
export class Home {
  constructor(private readonly root: string) {}

  private fullPath(path: string) {
    return join(this.root, ...path.split('/').filter(Boolean));
  }

  /** Empties the home directory. Every test starts from nothing. */
  reset() {
    for (const name of readdirSync(this.root)) {
      rmSync(join(this.root, name), { recursive: true, force: true });
    }
  }

  folder(path: string) {
    mkdirSync(this.fullPath(path), { recursive: true });
  }

  /** Creates a file of exactly `bytes` bytes (parent folders are created as needed). */
  file(path: string, bytes: number) {
    mkdirSync(dirname(this.fullPath(path)), { recursive: true });
    writeFileSync(this.fullPath(path), Buffer.alloc(bytes, 'x'));
  }

  exists(path: string) {
    try {
      statSync(this.fullPath(path));
      return true;
    } catch {
      return false;
    }
  }

  /** Names inside a folder, straight from the disk. Stronger than asking the app, and shows leftover partial files. */
  names(path: string) {
    return readdirSync(this.fullPath(path)).sort();
  }
}

export const test = base.extend<{ home: Home }>({
  home: async ({}, use) => {
    const root = process.env.TEST_HOME;
    if (!root) throw new Error('TEST_HOME is not set. Run the tests through playwright.config.ts.');
    const home = new Home(root);
    home.reset();
    await use(home);
  },
});

export { expect };
