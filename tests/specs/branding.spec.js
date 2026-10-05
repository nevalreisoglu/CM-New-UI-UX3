// @ts-check
const { test, expect } = require('./fixtures');

/**
 * v41 corrected the brand to ETIYA. The old spelling crept in through the logo,
 * the footer, the campaign label list and the admin role name, so guard all of
 * them plus the rendered text as a whole.
 */
test.describe('branding', () => {
  test('the top bar and footer read ETIYA', async ({ app }) => {
    await expect(app.locator('header .logo .w b')).toHaveText('ETIYA');
    await expect(app.locator('footer .logo .w b')).toHaveText('ETIYA');
    await expect(app.locator('footer .c')).toContainText('ETIYA ALL RIGHTS RESERVED');
  });

  test('the old ETYA spelling appears nowhere in the rendered page', async ({ app }) => {
    const stray = await app.evaluate(() =>
      (document.body.innerText.match(/\bET[İI]?YA\b/gi) || []).filter((m) => m.toUpperCase() !== 'ETIYA')
    );
    expect(stray, 'no "ETYA" left in visible text').toEqual([]);
  });

  test('the admin role is named Etiya Admin', async ({ app }) => {
    await app.selectOption('#role-sel', 'admin');
    await expect(app.locator('#role-lbl')).toHaveText('Etiya Admin');
  });
});
