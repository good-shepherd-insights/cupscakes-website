# Workflow: Link Issue to PR

## Steps

1. **Identify both records.** Confirm the exact Linear issue and GitHub PR URL. Verify the PR repository, number, head branch, base branch, and current state.
2. **Check existing issue links.** Fetch the issue and avoid adding a duplicate attachment or link.
3. **Add the PR link to the issue.** Use the Linear issue link/attachment capability with a descriptive title such as `PR #90 — Add phone and pickup date to Snipcart checkout`.
4. **Preserve issue meaning.** Do not rewrite the issue description just to insert a PR URL unless the user explicitly asks; the link belongs in the issue's links/attachments.
5. **Verify the result.** Re-fetch the issue and confirm the exact PR URL is present.

## Rules

- Link the implementation PR, not an unrelated review, preview, or release URL.
- A PR link does not prove the issue is Done; follow the Close Issue workflow for state changes.
