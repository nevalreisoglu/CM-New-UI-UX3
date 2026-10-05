// @ts-check
const { test, expect, openPage } = require('./fixtures');

/** Every page reachable from the left menu, with the view it must activate. */
const PAGES = [
  ['Journeys', 'view-journeys'],
  ['Journey Monitor', 'view-monitor'],
  ['Segments', 'view-segmentation'],
  ['Policies', 'view-policies'],
];

test.describe('navigation', () => {
  test('the prototype boots on the Journey list as a marketer', async ({ app }) => {
    await expect(app.locator('.view.active')).toHaveId('view-journeys');
    await expect(app.locator('.nav button.active')).toHaveAttribute('data-view', 'journeys');
    await expect(app.locator('#role-lbl')).toHaveText('Marketer');
    await expect(app.locator('#crumb .cur')).toHaveText('Journeys');
    await expect(app.locator('#jl-card')).toBeVisible();
  });

  test('the menu is exactly the four Journey Studio pages', async ({ app }) => {
    const views = await app.$$eval('.nav button[data-view]', (bs) => bs.map((b) => b.dataset.view));
    expect(views).toEqual(['journeys', 'monitor', 'segmentation', 'policies']);
    const groups = await app.$$eval('.nav .grp[data-grp]', (gs) => gs.map((g) => g.dataset.grp));
    expect(groups).toEqual(['journey']);
  });

  for (const [label, viewId] of PAGES) {
    test(`the menu opens ${label}`, async ({ app }) => {
      await app.selectOption('#role-sel', 'admin');
      await openPage(app, label);
      await expect(app.locator('.view.active')).toHaveCount(1);
      await expect(app.locator('.view.active')).toHaveId(viewId);
      await expect(app.locator('#crumb .cur')).toHaveText(label);
      await expect(app.locator('#crumb')).toContainText(label);
    });
  }

  test('the stripped modules are gone from the page, not just hidden', async ({ app }) => {
    for (const v of ['dashboard', 'start', 'programs', 'campaigns', 'offers', 'surveys', 'reports', 'opsan', 'api', 'datamart', 'content', 'parameters', 'about']) {
      await expect(app.locator(`#view-${v}`), v).toHaveCount(0);
      await expect(app.locator(`.nav button[data-view="${v}"]`), v).toHaveCount(0);
    }
    await expect(app.locator('#btn-help')).toHaveCount(0);
  });

  test('the burger collapses the menu to an icon rail and back', async ({ app }) => {
    const shell = app.locator('.app');
    await expect(shell).not.toHaveClass(/nav-closed/);

    await app.locator('#btn-nav').click();
    await expect(shell).toHaveClass(/nav-closed/);
    await expect(app.locator('#btn-nav')).toHaveAttribute('title', 'Expand menu');
    // labels collapse into tooltips, so every button keeps its name in title=
    await expect(app.locator('.nav button[data-view="monitor"]')).toHaveAttribute('title', 'Journey Monitor');

    await app.locator('#btn-nav').click();
    await expect(shell).not.toHaveClass(/nav-closed/);
    await expect(app.locator('#btn-nav')).toHaveAttribute('title', 'Collapse menu');
  });

  test('the breadcrumb names the group and the page', async ({ app }) => {
    await openPage(app, 'Segments');
    await expect(app.locator('#crumb')).toContainText('Journey Studio');
    await expect(app.locator('#crumb .cur')).toHaveText('Segments');
  });
});
