---
name: pr
description: Create or update a ready-for-review pull request for the current Cups & Cakes work.
argument-hint: "Issue ID, PR target, or scope/context"
user-invocable: true
disable-model-invocation: false
---

Run the repository's pull-request workflow for the requested change.

1. Read `.claude/skills/cupscakes-project-management/workflows/github/pull-request.md` and follow it exactly.
2. Resolve the Linear issue, repository, current branch, and target branch from `$ARGUMENTS` and local git context.
3. Inspect scope, stage only intended files, validate, commit, and push.
4. Create or update the existing PR using the requested target. Make it ready for review when requested; do not create duplicate PRs.
5. Link the PR to its Linear issue and report checks, blockers, branch, commit, and PR URL.

User context:

```text
$ARGUMENTS
```
