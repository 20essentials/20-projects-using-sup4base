---
name: add-view-transitions
description: Add and verify Astro view transitions between a collection listing and its detail page. Use when asked to animate a card image into the matching detail image.
---

# Add Astro view transitions

Add a view transition between a collection listing and its detail page so the
card image morphs into the main detail image. This can apply to products, blog
posts, events, workshops, gift cards, or another collection.

## 1. Clarify the requested scope

Before editing, ask the user for any missing choices in one interaction:

- Which collection's listing and detail pages should be connected? Discover
  existing collections under `src/pages/` and offer those plus a custom option.
- Which stable item identifier should determine the transition name? Prefer
  `slug` (or the SDK equivalent such as `seoName` or `handle`), then `_id`, then
  a normalized title.
- Should the transition cover only the main listing or also secondary sources
  such as related items, lookbooks, or the home-page feed?
- If secondary sources are included, should their cards morph too? By default,
  do not give secondary cards the same transition name.

If the user already supplied the collection and identifier, do not ask for
those again; confirm only the remaining choices. Do not edit until the scope
is clear.

## 2. Inspect the project

Do not assume the architecture. Identify:

- The root layout and whether it includes `<ClientRouter />` from
  `astro:transitions`. Add it if missing; it is required for Astro's client-side
  view transitions.
- The component that renders listing cards.
- The dynamic detail route for the selected collection.
- How each page obtains the item identifier and image URL. Use the same
  identifier source that the card uses for its detail link.
- Whether the project is actually Astro. If it is not, explain that this
  recipe does not directly apply, describe the native equivalent, and ask
  before implementing a different approach.

Respect the repository's architecture, naming conventions, and applicable
`AGENTS.md` instructions.

## 3. Add matching, unique transition names

Put the same name on the image containers in the listing card and detail page.
Prefix the identifier so the resulting CSS identifier never starts with a
digit:

```astro
<!-- Listing card -->
<div transition:name={id ? `view-${id}` : undefined}>
  <img ... />
</div>

<!-- Detail page -->
<div transition:name={id ? `view-${id}` : undefined}>
  <img ... />
</div>
```

The transition name belongs on the image container, not the `<img>`, so the
frame, corners, and overflow participate in the morph. If the identifier is
missing, use `undefined`; never assign a shared fallback name.

Ensure a rendered page never contains duplicate transition names. In
particular, exclude the current item from related-item cards or give those
cards a distinct name, and handle items repeated in featured and feed sections.
Keep hydrated overlays such as wishlist buttons outside the named container.
The card's link may wrap the named container.

## 4. Optional animation polish

Only add custom animation when requested or when the default morph has a
demonstrable issue:

- Use `transition:persist` on layout chrome such as the header only if needed.
- Put custom `::view-transition-old/new-*` rules in a global stylesheet, not
  inline styles.
- Preserve `prefers-reduced-motion` behavior.

## 5. Verify and report

Run the checks available in the project and report exact commands and results:

1. Run `npm run check` if the project defines it; otherwise use the available
   Astro/type checks.
2. Run `npx astro build`.
3. Check generated output for duplicate `view-transition-name` values per
   rendered page.
4. Run `npm run test:e2e` if available.
5. If practical, manually verify navigation from a card to its detail page.

Explicitly state any check that could not be run.

## Notes

- Without `<ClientRouter />`, navigation may reload the page and the morph will
  not run.
- A lazy-loaded card image may not be decoded in time; address this only if it
  causes a visible issue.
- With localized slugs, use the same slug source for both the card link and
  transition name.
