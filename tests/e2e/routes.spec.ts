import { expect, test } from '@playwright/test';

const featureIndexes = [
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

const subPages = [
  'github-auth-email/login',
  'github-auth-email/register',
  'login-register-email/login',
  'login-register-email/register',
  'login-google/login',
  'login-google/auth',
  'global-designs-storage/world-canvas',
  'database-webhook/webhook-notifications',
  'magic-link-auth/login'
];

test.describe.serial('every published route answers 200', () => {
  for (const route of [...featureIndexes, ...subPages]) {
    test(`GET /${route}`, async ({ request }) => {
      const response = await request.get(`/${route}`);
      expect(response.status(), route).toBe(200);
    });
  }
});
