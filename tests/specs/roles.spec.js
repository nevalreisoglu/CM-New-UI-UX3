// @ts-check
const { test, expect, setRole, visibleNavLabels } = require('./fixtures');

/**
 * The Journey Studio has one menu for every role; the role decides what a page
 * lets you do (activate, stop) rather than which pages exist.
 */
const ALL = ['Journeys', 'Journey Monitor', 'Segments', 'Policies'];

test.describe('role views', () => {
  test('the role switcher offers Marketer, Approver and Admin only', async ({ app }) => {
    const roles = await app.$$eval('#role-sel option', (os) => os.map((o) => o.value));
    expect(roles).toEqual(['marketer', 'approver', 'admin']);
  });

  for (const role of ['marketer', 'approver', 'admin']) {
    test(`${role} sees all four pages`, async ({ app }) => {
      await setRole(app, role);
      expect(await visibleNavLabels(app)).toEqual(ALL);
      const hidden = await app.$$eval('.nav button[data-view]', (bs) => bs.filter((b) => b.hidden).map((b) => b.dataset.view));
      expect(hidden).toEqual([]);
    });
  }

  test('the footer note follows the role', async ({ app }) => {
    await setRole(app, 'marketer');
    await expect(app.locator('#nav-foot')).toContainText('Marketer');
    await setRole(app, 'approver');
    await expect(app.locator('#nav-foot')).toContainText('Approver');
    await setRole(app, 'admin');
    await expect(app.locator('#nav-foot')).toContainText('Admin');
  });

  test('switching role keeps the open page', async ({ app }) => {
    await setRole(app, 'marketer');
    await app.locator('.nav button[data-view="segmentation"]').click();
    await expect(app.locator('.view.active')).toHaveId('view-segmentation');
    await setRole(app, 'approver');
    await expect(app.locator('.view.active')).toHaveId('view-segmentation');
    await expect(app.locator('.nav button.active')).toHaveAttribute('data-view', 'segmentation');
  });
});
