import { chromium, type Browser, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { deleteTestFile } from './data-clean-up';
import test from 'node:test';
import { expect } from '../support/fixtures';
import { fail } from 'assert';

const browser: Browser = await chromium.launch({ headless: false });
const page: Page = await browser.newPage();
const home = 'http://localhost:5120/browse/';

try {
    test('Selecting all folders and files'), async () => {
       
    }
}
finally {
    await browser.close();
    }