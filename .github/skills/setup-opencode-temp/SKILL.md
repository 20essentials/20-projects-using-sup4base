---
name: setup-opencode-temp
description: Configure a project-local .tmp directory for temporary artifacts and, when supported, allow OpenCode to access it. Use when asked to set up OpenCode temporary storage.
---

# Set up project-local temporary storage for OpenCode

Configure `./.tmp/` at the repository root as the default location for
temporary patches, logs, downloads, and intermediate artifacts. This avoids
relying on a system temporary directory.

## Setup

1. Create `.tmp/` in the repository root if it does not exist.
2. Add the following entry to the root `.gitignore` if it is not already
   covered by an equivalent rule:

   ```gitignore
   # temporary files for opencode
   /.tmp/
   ```

3. If the project has `opencode.json` or `.opencode/opencode.json` and its
   permission schema supports filesystem access rules, merge this allowance
   into the existing configuration:

   ```json
   {
     "permission": {
       "filesystem": {
         "allow": ["./.tmp/**"]
       }
     }
   }
   ```

   Preserve existing configuration; do not overwrite unrelated settings.
   Relative paths work on Windows as well. If OpenCode still prompts for a
   system temp path such as `AppData\\Local\\Temp`, explain the option of
   authorizing that specific pattern rather than broadening access by default.

## Usage and safety

Use `.tmp/` for temporary patches, logs, downloads, and intermediate files.
Do not put secrets or durable project data there. Do not delete its contents
unless the user requests cleanup; before cleanup, inspect the exact target and
remove only the intended temporary files.

## Verify and report

Confirm the directory exists, the ignore rule is effective, and any OpenCode
configuration remains valid JSON. Report any configuration that could not be
added because the project does not support the permission schema.
