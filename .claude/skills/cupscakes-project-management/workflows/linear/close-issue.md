# Workflow: Close or Cancel Issue

## Steps

1. **Identify the issue and requested terminal state.** Use `Done`, `Canceled`, or `Duplicate` only when the user or verified project state supports it.
2. **Verify the evidence.**
   - `Done`: implementation PR merged into `main`; deployment/release status is separate.
   - `Canceled`: user explicitly stops or abandons the work; record why and the replacement plan if one exists.
   - `Duplicate`: identify the surviving issue and preserve the relationship.
3. **Check for an existing shipped, cancellation, or duplicate note.** Avoid duplicate comments.
4. **Update the issue state** with `save_issue` using the exact team state name.
5. **Add a factual comment.** For Done, link the merged implementation PR and optional release PR. For Canceled or Duplicate, record the reason and next destination without rewriting history.
6. **Re-fetch and verify** the final state and comment/link.

## Rules

- Do not mark an issue Done because a PR was merely opened, reviewed, or deployed to preview.
- Do not silently convert a failed implementation into Done; use Canceled when the user stops it.
