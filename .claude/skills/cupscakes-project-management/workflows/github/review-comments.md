# Workflow: Address Review Comments

## Steps

1. **Resolve the PR.** Confirm the repository and PR number. Check authentication before using `gh`.
2. **Read thread-aware review data.** Use the bundled review-comment fetcher or equivalent GraphQL query so each thread's `isResolved`, `isOutdated`, file, and line are known.
3. **Cluster the feedback.** Separate actionable requests from approvals, walkthroughs, duplicates, informational notes, and outdated threads.
4. **Verify each actionable finding against current code.** Fix only valid findings. If comments conflict or a suggestion would regress behavior, document the conflict before changing code.
5. **Implement all requested fixes on the existing PR branch.** Keep changes minimal and traceable to the review thread. Run relevant checks.
6. **Push the update to the same PR.** Do not create a second PR for review follow-up.
7. **Resolve addressed threads.** Resolve only after the corresponding fix is pushed and verified. Leave invalid, ambiguous, or intentionally deferred threads open with a concise explanation.
8. **Re-fetch review threads.** Confirm there are no unresolved actionable threads before reporting completion.

## Rules

- A review comment is not automatically correct; validate it against the repository and the requested behavior.
- Do not claim comments are resolved from a flat comment summary alone.
- Do not resolve a thread that was not actually addressed.
