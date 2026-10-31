import { expect, it } from 'vitest';

import { baseUrl } from '@/lib/functions';

const SITE = 'http://localhost:4321/';

it('baseUrl() builds the full url for a route without a leading slash', () => {
  expect(baseUrl('pixel-art/')).toBe(`${SITE}pixel-art/`);
});

it('baseUrl() builds the full url for a route with a leading slash', () => {
  expect(baseUrl('/login-google/login')).toBe(`${SITE}login-google/login`);
});

it('baseUrl() does not duplicate the site origin', () => {
  expect(baseUrl('global-todo-list/')).toBe(`${SITE}global-todo-list/`);
});
