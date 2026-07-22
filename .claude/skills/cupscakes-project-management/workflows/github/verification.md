# Workflow: Deployment Verification

## Steps

1. **Verify the PR head.** Record the PR head SHA and confirm the deployment was built from that exact SHA, not an older commit or a different branch.
2. **Check CI.** Inspect required GitHub checks. Distinguish code failures from infrastructure or service failures (for example, Nx Cloud authorization).
3. **Check the preview deployment.** Confirm Vercel reports a completed deployment for the PR head and capture the preview URL.
4. **Test the actual preview behavior.** Exercise the changed user flow in the deployed preview, including the acceptance criteria and the relevant regression path. Source inspection alone is not deployment verification.
5. **Report the result precisely.** State what passed, what failed, what could not be tested, and which commit/deployment was inspected. Do not call the work complete when the preview is stale, inaccessible, or behavior is unverified.

## Required evidence

- PR number and head SHA
- CI/check status
- Deployment status and preview URL
- Acceptance-criteria behavior observed in the preview
- Any remaining blocker or environment limitation
