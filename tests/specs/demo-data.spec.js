// @ts-check
const fs = require('fs');
const path = require('path');
const { test, expect } = require('./fixtures');

/**
 * The prototype is shown to customers: its demo data must carry no real person,
 * customer or employee. Names come from DEMO_USERS; sample customers have masked
 * ids, +1 5XX numbers and @example.com addresses.
 */
const SOURCE = fs.readFileSync(path.resolve(__dirname, '..', '..', 'index.html'), 'utf8');
const REMOVED = ['Fahri Kerçek', 'Emrah Tekkanat', 'Neval Reisoğlu', 'Burcu Şahin', 'Berk Demir', 'Buket Vatansever', 'Ali Yasin Çiçek'];

test.describe('demo data', () => {
  test('no real person is named anywhere in the file', () => {
    for (const name of REMOVED) expect(SOURCE, name).not.toContain(name);
  });

  test('every e-mail address in the file is on example.com', () => {
    const domains = [...SOURCE.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[a-z]{2,})/g)].map((m) => m[1]);
    expect(domains.length).toBeGreaterThan(0);
    expect([...new Set(domains)]).toEqual(['example.com']);
  });

  test('sample contacts have masked ids and +1 5XX numbers', () => {
    expect(SOURCE).not.toMatch(/"MSISDN":"(?!\+1 5XX XXX)/);
    expect(SOURCE).not.toMatch(/"CUSTOMER_ID":"(?!CUS-\*{4}\d{4}")/);
  });

  test('the signed-in user in the top bar comes from DEMO_USERS', async ({ app }) => {
    const me = await app.evaluate(() => DEMO_USERS.me);
    await expect(app.locator('#me-name')).toHaveText(me);
  });
});
