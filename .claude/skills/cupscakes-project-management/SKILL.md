---
name: cupscakes-project-management
description: Manages this repo's work in Linear via the linear-server MCP — creating and updating issues, creating projects, adding/reusing labels, and posting status updates or comments, all scoped to the "Cups & Cakes" team and its "Cups & Cake Web - Online Ordering" project. Use this whenever the user wants to file a ticket, check what's in flight, tag/label something, move an issue's status, or post a progress update — even if they don't say the word "Linear" (e.g. "file a bug for this", "what's left to do", "mark this as in review", "post an update on where we're at"). This skill is specific to the cupscakes-website codebase; it does not apply to other Linear workspaces.
---

# Cupscakes Project Management (Linear)

## Follow each action's workflow exactly — it is not optional

Every action below has its own workflow file. That file is a required procedure, not a suggestion: when you're about to perform an action, open its workflow file and follow it step by step, in order. Do not skip a step, do not substitute a different sequence of Linear MCP calls because it looks equivalent, and do not improvise a shortcut even when the request seems simple.

This matters because Linear has no undo for clutter — a duplicate issue, a near-duplicate label ("bug" vs "Bug"), or a status update posted to the wrong place doesn't get cleaned up automatically, and it degrades the tracker for anyone who looks at it later, including future you. The workflows exist to prevent exactly that class of mistake.

If an action's workflow file says **not yet defined**, stop and ask the user rather than guessing a procedure. Do not perform that action freehand.

## Workspace (fixed)

This workspace currently has exactly one team and one project, so don't ask the user to specify them — use these by default:

- Team: **Cups & Cakes** (key `CUP`, id `aa9f891f-a630-49c1-9888-b96f43394134`)
- Project: **Cups & Cake Web - Online Ordering** (id `d5593274-9368-4cd3-8804-43b95dfe0bc7`)

If a second team or project ever shows up (`list_teams` / `list_projects` with no query), update this section rather than guessing which one the user means.

## Actions

This is a directory of every action this skill covers. Each row is a distinct action with its own mandatory workflow file under `workflows/` — go to that file before acting.

| Action | Workflow file | Status |
|---|---|---|
| Create Issue | `workflows/create-issue.md` | defined |
| Update Issue | `workflows/update-issue.md` | defined |
| Create Project | `workflows/create-project.md` | not yet defined |
| Update Project | `workflows/update-project.md` | defined |
| Add/Reuse Label | `workflows/add-label.md` | not yet defined |
| Post Status Update | `workflows/post-status-update.md` | not yet defined |
| Add Comment | `workflows/add-comment.md` | defined |
| Triage Issues | `workflows/triage-issues.md` | defined |

## Conventions learned so far

- **Create Issue — Bug vs. Feat:** a customer/stakeholder request to adjust or improve something (visual polish, consistency, UX tweaks) is `Feat`, not `Bug` — even when it's "fixing" an inconsistency. `Bug` is reserved for things that are actually broken. See `workflows/create-issue.md` for the full tie-breaker.
- **Triage Issues defaults to open work only** (excludes Done/Canceled/Duplicate) and is read-only — it never changes an issue itself. See `workflows/triage-issues.md`.
- **Update Issue — the "Done" bar is merged into `main`**, not just PR-opened and not gated on a production release. A production release (`release/main-to-production-*` → `production`) merging in the same pass is worth noting in the paired shipped-comment, but doesn't change when Done gets set. See `workflows/update-issue.md`.
- **A Done transition gets paired with a "shipped" comment** linking the merge PR (and the release PR, if one happened too) — two separate calls (`save_issue` then `save_comment`), not one. See `workflows/add-comment.md`'s template.
