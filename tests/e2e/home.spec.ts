import { expect, test } from '@playwright/test';

test('home page renders the index of the 21 features', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/20 Projects With Supabase/);
  const links = page.locator('.container-links a');
  await expect(links).toHaveCount(21);
  await expect(page.locator('.container-links a').first()).toHaveText(
    '1) Global Todo List'
  );
});

test('home links navigate to their screaming-architecture routes', async ({
  page
}) => {
  await page.goto('/');

  const links = await page
    .locator('.container-links a')
    .evaluateAll(nodes => nodes.map(node => ({
      href: node.getAttribute('href'),
      text: node.textContent ?? ''
    })));

  const slugs = [
    'global-todo-list/',
    'github-auth-email/project-02-github-auth-and-email',
    'login-register-email/',
    'login-google/',
    'pixel-art/',
    'realtime-active-users/',
    'global-designs-storage/',
    'one-piece-wanted-poster/',
    'rpc-counter/',
    'chat-broadcast-realtime/',
    'database-webhook/',
    'crud-rest-api/',
    'magic-link-auth/',
    'postgres-trigger/',
    'draggable-realtime/',
    'database-pagination/',
    'fulltext-websearch/',
    'partial-search/',
    'table-partitioning/',
    'bow-arrow-leaderboard/',
    'spaced-repetition-scheduler/'
  ];

  expect(links.map(l => l.href)).toEqual(slugs);
  expect(links[0].text).toContain('Global Todo List');
  expect(links[20].text).toContain('Spaced Repetition Scheduler');
});
