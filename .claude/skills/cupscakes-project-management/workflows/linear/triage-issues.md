# Workflow: Triage Issues

## Steps

1. **Pull the latest issues.** Call `list_issues` scoped to `team="CUP"`, `project="Cups & Cake Web - Online Ordering"`, `orderBy="updatedAt"` — "latest" means most recently touched, not most recently created. Default `limit=20`; only go higher (tool max is 250) if the user asks for more.

2. **Choose the lens.** If the user names a lens, use it. Otherwise use the documented default: **Everything open**.
   - Everything open (default/recommended)
   - Bugs only
   - By priority (ask which tier)
   - Everything, including Done/Canceled/Duplicate

3. **Apply the filter:**

   | Filter | How |
   |---|---|
   | Bugs only | `label="Bug"` |
   | By priority | Map the tier name to Linear's numeric scale (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low), pass `priority=<n>` |
   | Open only (default) | No single param does this — `list_issues`'s `state` filter takes one value/type at a time and can't express "not Done/Canceled/Duplicate." Pull without a `state` filter, then drop any issue whose `statusType` is `completed`, `canceled`, or `duplicate` before presenting. |
   | Everything (incl. closed) | Pull unfiltered, don't drop anything |

4. **Summarize each remaining issue in 1–3 sentences** — enough to convey scope, not a restatement of the title. Read it from the issue's `description`; if the list result truncated it and the summary/acceptance criteria matter, call `get_issue` for the full text. Don't pad a thin description with invented scope — say "no detail beyond the title yet" instead.

5. **Present as a compact list, ranked by priority then recency** (Urgent → High → Medium → Low → None) — not raw API order, since surfacing what's urgent is the point of triage. For each issue show: identifier + title, priority, state, label, and the summary.

6. **This is read-only.** Don't call `save_issue` or change anything found during triage. If the user wants to act on something surfaced here (reprioritize, move state, etc.), that's the separate Update Issue workflow — only go there if they explicitly ask.
