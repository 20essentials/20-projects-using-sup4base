import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { PATH as path02 } from '@/features/github-auth-email/paths';
import { PATH as path03 } from '@/features/login-register-email/path';
import { PATH as path04 } from '@/lib/auth-path';
import { PATH as path11 } from '@/features/database-webhook/path';
import { PATH as path13 } from '@/features/magic-link-auth/path';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const routeToPageFile = (route: string) => {
  const clean = route.replace(/\/$/, '').replace(/^\//, '');
  const segments = clean.split('/');
  const file =
    segments.length > 1
      ? `${segments[segments.length - 1]}.astro`
      : 'index.astro';
  return path.join(rootDir, 'src/pages', ...segments.slice(0, -1), file);
};

const expectRulePointsToExistingPage = (route: string) => {
  const absolute = route.startsWith('/') ? route : `/${route}`;
  expect(route, 'route must match a real page').toMatch(
    /^\/*[a-z0-9-]+(\/[a-z0-9-]+)*\/?$/
  );
  expect(fs.existsSync(routeToPageFile(absolute)), route).toBe(true);
};

describe('scream architecture: every PATH points at a real page', () => {
  it('github-auth-email PATH', () => {
    expect(path02.LOGIN).toBe('/github-auth-email/login');
    expect(path02.REGISTER).toBe('/github-auth-email/register');
    expect(path02.INDEX).toBe(
      '/github-auth-email/project-02-github-auth-and-email'
    );
    [path02.LOGIN, path02.REGISTER, path02.INDEX].forEach(
      expectRulePointsToExistingPage
    );
  });

  it('login-register-email PATH', () => {
    expect(path03.index).toBe('/login-register-email/');
    expect(path03.login).toBe('/login-register-email/login');
    expect(path03.register).toBe('/login-register-email/register');
    [path03.index, path03.login, path03.register].forEach(
      expectRulePointsToExistingPage
    );
  });

  it('login-google PATH (shared auth)', () => {
    expect(path04.index).toBe('/login-google/');
    expect(path04.login).toBe('/login-google/login');
    [path04.index, path04.login].forEach(expectRulePointsToExistingPage);
  });

  it('database-webhook PATH', () => {
    expect(path11.index).toBe('/database-webhook/');
    expect(path11.webhookNotificationsPage).toBe(
      '/database-webhook/webhook-notifications'
    );
    [path11.index, path11.webhookNotificationsPage].forEach(
      expectRulePointsToExistingPage
    );
  });

  it('magic-link-auth PATH', () => {
    expect(path13.index).toBe('/magic-link-auth/');
    expect(path13.login).toBe('/magic-link-auth/login');
    [path13.index, path13.login].forEach(expectRulePointsToExistingPage);
  });
});

describe('home feature lists every published feature', () => {
  const mainAstro = path.join(
    rootDir,
    'src/features/home/main.astro'
  );

  it('declares 20 hrefs that all resolve to real pages', () => {
    const content = fs.readFileSync(mainAstro, 'utf-8');
    const hrefs = [...content.matchAll(/href: '([^']+)'/g)].map(m => m[1]);

    expect(hrefs).toHaveLength(20);
    hrefs.forEach(expectRulePointsToExistingPage);
  });
});
