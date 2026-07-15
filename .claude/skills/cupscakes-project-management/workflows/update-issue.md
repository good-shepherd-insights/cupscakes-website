# Workflow: Update Issue

## Steps

1. **Identify the issue.** Use its identifier (e.g. `CUP-52`). Never assume which issue if there's any ambiguity — ask.
2. **Confirm exactly which field(s) are changing** rather than assuming a full re-triage. The two routine ones:

   | Field | Rule |
   |---|---|
   | `state` | Move it through the lifecycle as work progresses (Todo → In Progress → In Review → Done, or → Canceled/Duplicate). Check the exact state name via `list_issue_statuses(team="CUP")` if unsure — don't guess a name. |
   | `priority` | Same 0–4 scale as Create Issue (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low). |

3. **"Done" means the fix has actually merged — not just opened a PR.** The bar observed on this project's issues (see CUP-42/44/46 backfill comments) is: the PR that implements the fix is merged into `main`. Don't move an issue to Done while its PR is still open or only merged into a feature branch.
4. **If a release PR (`release/main-to-production-*` → `production`) was also merged in the same pass**, that's worth surfacing too — see the "shipped" comment template in `workflows/add-comment.md`. It doesn't change *when* the issue moves to Done (that's still gated on the `main` merge), it's just additional traceability once production catches up.
5. **Only touch other fields when explicitly asked** — `label`, `assignee`, `estimate`, `dueDate`, `description`, etc. Don't bundle an unrelated field change into a routine status update (same rule as Update Project).
6. **Update with `save_issue`** (`id=<issue identifier>`, plus whichever of the above actually changed).
7. **Pair a Done transition with a comment** when the issue was closed out because work shipped — post the PR link(s) via the Add Comment workflow (`workflows/add-comment.md`) right after the state change, so anyone reading the issue later can trace exactly what merged where. These are two separate tool calls (`save_issue` then `save_comment`), not one — don't skip either half.
