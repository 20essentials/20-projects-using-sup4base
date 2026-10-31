// @vitest-environment happy-dom
import { describe, beforeEach, expect, it } from 'vitest';

import { PATH } from '@/lib/auth-path';
import { $, $$ } from '@/lib/functions';
import {
  deletePreviousUrl,
  previousPageURL,
  setPreviousUrl
} from '@/lib/local-storage';

beforeEach(() => {
  document.body.innerHTML =
    '<div id="app"></div><span class="link"></span><span class="link"></span>';
  deletePreviousUrl();
});

describe('$() and $$()', () => {
  it('$() returns the first matching element', () => {
    const el = $('#app');
    expect(el).not.toBeNull();
    expect(el.tagName).toBe('DIV');
  });

  it('$$() returns all matching elements', () => {
    expect($$('.link')).toHaveLength(2);
  });

  it('returns typed elements', () => {
    const el = $<HTMLDivElement>('#app');
    expect(el.id).toBe('app');
  });
});

describe('local-storage helpers', () => {
  it('setPreviousUrl() stores the previous url', () => {
    setPreviousUrl({ previousUrl: 'http://localhost:4321/pixel-art/' });
    expect(previousPageURL()).toBe('http://localhost:4321/pixel-art/');
  });

  it('deletePreviousUrl() falls back to the google login feature index', () => {
    setPreviousUrl({ previousUrl: 'http://localhost:4321/pixel-art/' });
    deletePreviousUrl();
    expect(previousPageURL()).toBe(PATH.index);
  });
});
