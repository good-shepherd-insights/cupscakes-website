# Workflow: Post Status Update

## Steps

1. **Identify and fetch the project.** Confirm the project name/id, current health, and latest status update before writing.
2. **Use a dated, stakeholder-readable format.** Keep the update concise and lead with the overall status and one-paragraph executive summary.
3. **Cover four things:** meaningful progress since the last update, the immediate next milestone, risks/blockers or explicitly none, and decisions/asks if any.
4. **Prefer outcomes over ticket dumps.** Link only the few issues that explain the milestone; do not list every completed ticket.
5. **Choose health from evidence:** `onTrack`, `atRisk`, or `offTrack`. Do not mark a project on track when a known blocker threatens the next milestone.
6. **Post with `save_status_update`** using `type="project"` and the confirmed project. Do not update the project description as a substitute for a status update.
7. **Re-fetch and verify** the new update, health, and project association.

## Recommended shape

```markdown
## Project update — <date>

**Status: <On track | At risk | Off track>**

<One short paragraph describing the current state and why it matters.>

**Progress**
- <Outcome or milestone>

**Next milestone**
- <Immediate next outcome and linked issue(s)>

**Risks / decisions**
- <Risk, decision, or “None at this time.”>
```
