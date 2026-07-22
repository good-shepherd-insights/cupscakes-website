# Workflow: Pull Request Lifecycle

## Steps

1. **Resolve the issue and branch.** Confirm the Linear identifier, repository, head branch, and target branch. Search for an existing PR before creating another.
2. **Inspect scope before staging.** Run `git status -sb` and review the diff. Stage only files belonging to the requested change.
3. **Validate locally.** Run the repository's relevant checks. Record missing dependencies or infrastructure failures separately from code failures.
4. **Commit and push intentionally.** Use a concise commit message and push the named head branch with upstream tracking.
5. **Create or update the PR.** Use the correct base branch. When the user asks for a PR ready for review, create it non-draft; otherwise preserve the requested draft state. Never create a duplicate PR for the same head/base pair.
6. **Write a factual PR body.** Include what changed, why, linked Linear issue, validation performed, and known blockers.
7. **After review changes, update the same PR.** Push new commits to the existing head branch; do not open a replacement PR unless explicitly requested.

## Completion bar

A PR is ready for review only when its scope is clear, the Linear issue is linked, relevant checks have been run, and known failures are called out. A ready PR is not the same as a merged PR or a production release.
