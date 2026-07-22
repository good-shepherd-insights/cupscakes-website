# Workflow: Branch and Release Flow

## Steps

1. **Confirm the repository and current state.** Run `git status -sb`, inspect unrelated changes, and identify the current branch. Do not overwrite or stage unrelated work.
2. **Start feature work from the latest `main`.** Fetch remotes, verify `main` is current, and create a focused branch named `feature/cup-<issue>-<short-description>` (or preserve an explicitly requested branch name).
3. **Merge feature work into `main` through a PR.** The feature PR targets `main`; do not target `production` directly.
4. **Create the release branch from updated `main`.** Use `release/main-to-production-YYYY-MM-DD` after the feature PR is merged. The release branch must contain the exact current `main` history plus only the intended release changes.
5. **Open the production PR.** The release PR targets `production`. Never merge a feature branch directly into `production`.
6. **Check synchronization after each merge.** Confirm the expected commit ancestry and that `main` and `production` differ only by the release work waiting to be promoted.

## Rules

- A PR is required for feature → `main` and release → `production`.
- Do not force-push shared branches or rewrite `main`, release branches, or `production`.
- Do not mark a Linear issue Done until its implementation PR has merged into `main`; production promotion is separate traceability.
