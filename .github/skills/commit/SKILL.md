---
name: commit
description: Review pending repository changes and create cohesive Conventional Commits without pushing. Use when asked to commit pending work.
---

# Commit pending changes

Create commits for the pending repository changes. Do not push unless the user
asks.

## Process

1. Inspect `git status`, staged and unstaged diffs, and the last ten commits
   (`git log --oneline -10`) to understand the changes and existing message
   style.
2. If sensitive files such as `.env`, keys, or tokens appear, do not stage
   them; tell the user.
3. If changes are already staged, commit that staged work first, as staged.
4. Group the remaining changes into logical, independently working units such
   as a feature, bug fix, or refactor. Keep related files together and avoid a
   single oversized commit.
5. Stage each group explicitly, inspect its effective staged diff with
   `git diff --cached`, then commit that group before moving on.

Never include `.wix/`, `.tmp/`, `node_modules/`, or files ignored by
`.gitignore`. Do not include unrelated files or accidental generated changes.
Include a lockfile only when it is part of the dependency change.

## Commit messages

Use Conventional Commits:

```text
type(scope): description
```

- Allowed types: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`,
  `ci`, `build`, and `style`.
- Use an optional short, singular, kebab-case scope, such as `cart`, `events`,
  `blog`, or `nav`. Omit the scope for global changes.
- Write the description in English, lowercase, imperative, positive wording,
  and no more than 72 characters; omit the final period.
- Keep implementation and its tests in the same cohesive commit.
- Add a body only when useful to explain why or a non-obvious design decision.
  Wrap it to about 72 columns.

Do not use `git commit -i`, force-push, or amend a failed commit. If a hook
rejects a commit, resolve the issue and create a new commit. At the end, report
the hashes of all commits created, one per line.
