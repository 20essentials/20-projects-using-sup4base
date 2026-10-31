import { expect, test } from '@playwright/test';

test('an unauthenticated user visiting a protected feature is sent to the google login', async ({
  page
}) => {
  await page.goto('/pixel-art/');

  await page.waitForURL(/\/login-google\/login$/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/login-google\/login$/);

  const previousUrl = await page.evaluate(() =>
    localStorage.getItem('previous-page')
  );
  expect(previousUrl).toContain('pixel-art');
});

test('the login page shows the email login form (feature login-register-email)', async ({
  page
}) => {
  await page.goto('/login-register-email/login');

  const emailInputs = page.locator(
    'input[type=email], input[name=email], input[placeholder*="mail" i]'
  );
  await expect(emailInputs.first()).toBeVisible();
});

test('the global todo list loads its form', async ({ page }) => {
  await page.goto('/global-todo-list/');

  await expect(page.locator('#taskForm')).toBeVisible({ timeout: 15_000 });
});

test('the webhook api rejects an empty payload', async ({ request }) => {
  const response = await request.post('/api/total-webhook', {
    data: {}
  });

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBe('Missing fields in webhook payload');
});
