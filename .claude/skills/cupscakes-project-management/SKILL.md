---
name: cupscakes-project-management
description: Manages this repo's Linear and GitHub delivery workflow — issue/project tracking in Linear plus feature branches, pull requests, review follow-up, and deployment verification in GitHub. Use this for Cups & Cakes work involving tickets, estimates, labels, status changes, project updates, branch flow, PRs, review comments, or release handoff. This skill is specific to the cupscakes-website codebase and its Cups & Cakes Linear workspace.
---

# Cupscakes Project Management

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

This is a directory of every Linear action this skill covers. Each row is a distinct action with its own mandatory workflow file under `workflows/linear/` — go to that file before acting. GitHub actions are listed in their own table below.

| Action | Workflow file | Status |
|---|---|---|
| Create Issue | `workflows/linear/create-issue.md` | defined |
| Update Issue | `workflows/linear/update-issue.md` | defined |
| Create Project | `workflows/linear/create-project.md` | not yet defined |
| Update Project | `workflows/linear/update-project.md` | defined |
| Add/Reuse Label | `workflows/linear/add-label.md` | defined |
| Post Status Update | `workflows/linear/post-status-update.md` | defined |
| Add Comment | `workflows/linear/add-comment.md` | defined |
| Triage Issues | `workflows/linear/triage-issues.md` | defined |
| Format Issues | `workflows/linear/format-issues.md` | defined |
| Estimate Issues | `workflows/linear/estimate-issues.md` | defined |
| Link Issue to PR | `workflows/linear/link-issue-pr.md` | defined |
| Close/Cancel Issue | `workflows/linear/close-issue.md` | defined |

### GitHub workflows

| Action | Workflow file | Status |
|---|---|---|
| Branch and Release Flow | `workflows/github/branch-flow.md` | defined |
| Pull Request Lifecycle | `workflows/github/pull-request.md` | defined |
| Address Review Comments | `workflows/github/review-comments.md` | defined |
| Deployment Verification | `workflows/github/verification.md` | defined |

## Conventions learned so far

- **Create Issue — Bug vs. Feat:** a customer/stakeholder request to adjust or improve something (visual polish, consistency, UX tweaks) is `Feat`, not `Bug` — even when it's "fixing" an inconsistency. `Bug` is reserved for things that are actually broken. See `workflows/linear/create-issue.md` for the full tie-breaker.
- **Triage Issues defaults to open work only** (excludes Done/Canceled/Duplicate) and is read-only — it never changes an issue itself. See `workflows/linear/triage-issues.md`.
- **Update Issue — the "Done" bar is merged into `main`**, not just PR-opened and not gated on a production release. A production release (`release/main-to-production-*` → `production`) merging in the same pass is worth noting in the paired shipped-comment, but doesn't change when Done gets set. See `workflows/linear/update-issue.md`.
- **A Done transition gets paired with a "shipped" comment** linking the merge PR (and the release PR, if one happened too) — two separate calls (`save_issue` then `save_comment`), not one. See `workflows/linear/add-comment.md`'s template.
- **Format Issues normalizes title, estimate, missing project association, and description clarity** across non-archived `CUP` issues. It preserves description meaning and scope, uses the title rules from Create Issue, applies the team's `1/2/3/5/8` estimate scale, and never replaces an existing different project. See `workflows/linear/format-issues.md`.

## Workflow domains

- **Linear:** all current issue, project, label, comment, triage, and status-update procedures live under `workflows/linear/`.
- **GitHub:** branch, pull-request, review, and deployment procedures live under `workflows/github/`.
- **GitHub delivery order:** feature branch → `main` → `release/main-to-production-YYYY-MM-DD` → `production`. Never skip the release PR or claim production delivery from a feature PR alone.
