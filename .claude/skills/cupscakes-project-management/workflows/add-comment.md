# Workflow: Add Comment

## Steps

1. **Identify the entity.** Issues are the common case — pass `issueId=<identifier>` (e.g. `CUP-52`) to `save_comment`. Projects/initiatives/documents/milestones use their own id parameter instead; only one parent parameter is ever set.
2. **The recurring case is a "shipped" comment**, posted right after moving an issue to Done (see `workflows/update-issue.md` step 7). Use this template, adapting to what actually happened:

   > Shipped via PR #`<N>` ([`<url>`](`<url>`))`[, which also <br/>brief note if the PR grew beyond the ticket's original ask>]`. Released to production via PR #`<M>` ([`<url>`](`<url>`)).

   - Always include the merge-to-`main` PR — that's the one that actually implements the fix.
   - Only include the "Released to production via..." sentence if a `release/main-to-production-*` PR was actually merged into `production` as part of this same pass — don't imply a production release happened if it hasn't yet.
   - If the PR's scope grew beyond the ticket's original ask (e.g. a follow-up requirement added mid-review), say so in one clause — don't let the comment imply the shipped code is narrower than it actually is.
3. **Keep every comment factual and terse** — one or two sentences with PR numbers and links, not a restatement of the diff or the ticket's acceptance criteria (those already live on the issue).
4. **To reply within an existing thread** instead of starting a new one, pass `parentId=<comment id>` and `body` — no entity id needed, the reply inherits the parent's thread type.
5. **Post with `save_comment`.** This is a separate call from any `save_issue` state change — a status update and its explanatory comment are two calls, not one; don't skip either.
