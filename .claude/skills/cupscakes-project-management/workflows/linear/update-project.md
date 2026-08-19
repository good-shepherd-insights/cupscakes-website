# Workflow: Update Project

## Steps

1. **Identify the project.** Never assume — same rule as Create Issue. There's currently only one, but confirm rather than defaulting silently if there's any doubt.
2. **Focus on `state` and `priority`.** These are the two fields that matter for routine project updates. Confirm the current state via `list_projects`/`get_project` first — there's no dedicated project-status lookup tool, so don't guess a status name; read it off the project record.
3. **`description` and `summary` are the stakeholder-facing exception — keep them in sync.** `description` is the full write-up; `summary` is a ≤255-char one-liner shown on project cards/lists — think of it as the description's headline, not a separate voice. If the project has no description yet, or the user asks to write/revise one, both should describe outcomes and expectations: what the project delivers, why it exists, what success looks like to a stakeholder. Neither should read like a ticket — no implementation detail, no tech stack, no file paths. That level of detail belongs on individual issues, not the project.
4. **Everything else is secondary.** `name`, `lead`, `startDate`/`targetDate`, `color`, `icon`, `labels`, team/initiative membership — only touch these if the user explicitly asks. Don't bundle an unrelated field change into a routine state/priority update.
5. **"Resources" (external links on the project itself) can't be managed through this MCP.** Linear's project UI has a Resources section for attaching links, but every attachment tool this skill has access to (`create_attachment`, `prepare_attachment_upload`, `create_attachment_from_upload`) only accepts an `issue` parameter — none of them take a project. If the user asks to add a resource/link to the project (not an issue), tell them this has to be done directly in the Linear UI; don't attempt a workaround (e.g. attaching it to an arbitrary issue instead) without checking with them first.
6. **Update with `save_project`** (`id=<project id>`, plus whichever of the above actually changed).

## Field reference

| Field | When to touch it |
|---|---|
| `state` | Routine — update whenever the project's overall phase changes (e.g. Backlog → Started → Completed). |
| `priority` | Routine — same 0–4 scale as issues (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low). |
| `description` / `summary` | Only when missing or explicitly requested to revise — stakeholder outcomes/expectations, not engineering detail. Keep the two consistent with each other. |
| `name`, `lead`, dates, `color`, `icon`, `labels`, teams/initiatives | Only on explicit request — not part of a routine update. |
| Resources (external links) | Not supported via this MCP — direct the user to the Linear UI. |
