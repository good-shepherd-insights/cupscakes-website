# Workflow: Create Issue

## Steps

1. **Identify the project.** If the user names a project, use it. Otherwise use the configured default project, **Cups & Cake Web - Online Ordering**. Ask only if the workspace configuration indicates genuine ambiguity.
2. **Classify the issue into exactly one category** from the Title Categories table. If it's not clear which one fits, ask rather than guessing.
3. **Build the title** in the exact form `<Category>: <Component> – <Outcome>`, using the category's own pattern below. That dash is an en dash (`–`), not a hyphen, with a space on each side.
4. **Write the description** using the Description Template below.
5. **Set the required fields** — `state`, `priority`, `label` — per the rules in Required Fields below. These are not optional; every issue gets all three.
6. **Leave every other field blank** (`assignee`, `delegate`, `dueDate`, `cycle`, `milestone`, and all relationship/release fields) unless the user has explicitly said something that fills one in — e.g. they only get a `dueDate` if they mentioned one, an `estimate` only once complexity is actually assessed (see below).
7. **Create the issue** with `save_issue` (`team="CUP"`, `project=<confirmed project>`, plus everything above). Check for dupes first per the base skill's "look before you create" rule.

## Title Categories

| Category | Pattern | Example |
|---|---|---|
| Feat | `Feat: <Component> – <Outcome>` | Feat: Web app – support org-wide SSO |
| Bug | `Bug: <Component> – <Symptom>` | Bug: CLI – crashes when loading config |
| Chore | `Chore: <Component> – <Maintenance task>` | Chore: CI – bump Node.js to 22.x |
| Docs | `Docs: <Area> – <Documentation change>` | Docs: API – add webhook usage examples |
| Refactor | `Refactor: <Component> – <Internal change>` | Refactor: Auth – simplify token validation flow |
| Perf | `Perf: <Component> – <Performance goal>` | Perf: Search – reduce p95 latency under 300ms |
| Test | `Test: <Area> – <Test-related work>` | Test: Payments – add regression tests for refunds |
| Style | `Style: <Area> – <Formatting change>` | Style: Codebase – fix linting errors in utilities |
| Build | `Build: <Target> – <Build/config change>` | Build: Backend – switch Docker base image to Debian |
| CI | `CI: <Pipeline> – <CI change>` | CI: Tests – parallelize integration test jobs |

**Bug vs. Feat tie-breaker:** reserve `Bug` for something that's actually broken or wrong relative to a spec (crashes, errors, incorrect data). A customer/stakeholder asking for a visual or UX adjustment — e.g. "increase the weight/size/spacing of X to match Y," polish, consistency requests — is a `Feat`, even if it's fixing an inconsistency. The test isn't "is something technically not matching" — it's "was this requested as an enhancement" vs. "is this actually malfunctioning."

This still applies even when the thing being fixed is visual/design in nature — "design change" isn't automatically `Feat`. A skewed favicon (CUP-51) is a `Bug`: the asset has `preserveAspectRatio="none"` on a non-square viewBox, which is an objective rendering defect (the code produces visibly wrong output), not a preference. Contrast with CUP-5's font-weight mismatch, which was a subjective consistency ask with nothing technically malfunctioning. So the real test is: is there a technical cause producing objectively wrong output (Bug), or is someone asking for different output than what's currently, correctly, being produced (Feat)?

## Description Template

Every issue's `description` follows this shape, adapted to what's actually known — don't leave a section as boilerplate filler if there's nothing real to put there, but don't skip it silently either:

```markdown
## Summary
<1-3 sentences: what this is and why it matters>

## Details
<For a bug: symptom, where it happens, repro steps if known.
For a feature/chore/etc: scope of the change, what's in vs. out.>

## Acceptance Criteria
<What "done" looks like — bullet list. Optional if genuinely not knowable yet.>
```

## Required Fields

These three are set on every issue, never left blank:

| Field | Rule |
|---|---|
| `state` | Set to the team's default unstarted status — check the exact name via `list_issue_statuses(team="CUP")` rather than guessing (commonly "Backlog" or "Todo"). Only use a different state if the user says the work is already underway/done. |
| `priority` | Determine by severity, not by category alone: a **Bug that breaks something** → **Urgent (1)**. A **feature or addition** → **Low (4) or Medium (3)**, based on how impactful it is. Everything else (Chore, Docs, Refactor, etc.) → judge severity/urgency the same way — a non-breaking bug or routine chore is rarely Urgent. |
| `label` | Exactly one of: `Feature`, `Bug`, `Chore`, `Docs`, `Content`, `Design`. This is a separate, coarser taxonomy from the title category above — don't assume a 1:1 mapping (e.g. a `Perf:` or `Refactor:` titled issue still needs one of these six labels, picked by best fit). Check `list_issue_labels(team="CUP")` first and reuse the existing label — don't recreate it. |

## Fields left blank by default

`assignee`, `delegate`, `dueDate`, `cycle`, `milestone`, `parentId`, `blocks`/`blockedBy`/`relatedTo`/`duplicateOf`, `links`, releases.

The one exception: `estimate` isn't blanket-blank — set it once you've actually assessed the complexity of the work; only leave it blank if there's genuinely not enough information yet to size it.
