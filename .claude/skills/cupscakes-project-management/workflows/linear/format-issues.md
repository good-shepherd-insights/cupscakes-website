# Workflow: Format Issues

Use this workflow when the user asks to format, normalize, clean up, or standardize existing Cups & Cakes issues. This is a bulk maintenance action covering `title`, `estimate`, a missing `project` association, and description clarity without changing the issue's meaning or scope.

## Steps

1. **Resolve the issue set.**
   - If the user named one or more issue identifiers, process only those issues.
   - Otherwise, call `list_issues` with `team="CUP"`, `orderBy="updatedAt"`, `includeArchived=false`, and `limit=250`. Do not add a project or state filter: the purpose includes finding projectless issues and formatting non-archived historical work.
   - If the result has another page, continue from its cursor until every non-archived team issue has been retrieved.

2. **Load enough evidence for every decision.** Use each issue's title, description, status, current estimate, and current project. If the list response truncates the description or the available text does not support a confident title or estimate, call `get_issue` before deciding. Read relevant repository files when the issue names concrete code or behavior and that evidence is needed to assess scope. Never invent missing scope.

3. **Determine the canonical title.** Open `workflows/linear/create-issue.md` and apply its **Title Categories** table and **Bug vs. Feat tie-breaker** exactly.
   - The required shape is `<Category>: <Component> – <Outcome>`, using a spaced en dash (`–`), never a hyphen or em dash.
   - Select exactly one supported category: `Feat`, `Bug`, `Chore`, `Docs`, `Refactor`, `Perf`, `Test`, `Style`, `Build`, or `CI`.
   - Use the category-specific final segment from that table (`Outcome`, `Symptom`, `Maintenance task`, and so on).
   - Preserve product names, acronyms, routes, and other meaningful capitalization.
   - Do not rewrite a title that already conforms and accurately reflects the issue.
   - If the description and repository evidence do not support a confident category, component/area, or final segment, leave the title unchanged and record why it was skipped.

4. **Assess complexity on the team's Fibonacci point scale.** Complexity measures implementation effort, uncertainty, integration surface, and verification burden together; it is not priority or business urgency.

   | Estimate | Use when |
   |---|---|
   | `1` | Trivial, isolated change with an obvious implementation and verification path; typically one small content, asset, configuration, or styling adjustment. |
   | `2` | Small, localized change with limited branching or risk; usually one component or concern plus straightforward verification. |
   | `3` | Moderate change spanning multiple files or concerns, or requiring non-trivial interaction, state, integration, or regression verification. |
   | `5` | Large or cross-cutting change with substantial integration work, several behaviors, meaningful uncertainty, or broad regression risk. |
   | `8` | Very large, highly uncertain, or multi-workstream change that should usually be split before implementation. |

   - Use only `1`, `2`, `3`, `5`, or `8`.
   - Judge the work described by the issue, not the length of its description and not its priority.
   - For completed issues, use the implemented scope described by the issue and linked evidence when available.
   - If the issue lacks enough evidence for a defensible estimate even after the reads in step 2, leave the estimate unchanged and record why it was skipped.
   - Do not update an estimate that already matches the assessment.

5. **Attach the default project when missing.**
   - The target is **Cups & Cake Web - Online Ordering** (id `d5593274-9368-4cd3-8804-43b95dfe0bc7`).
   - If an in-scope `CUP` issue has no project, set this project.
   - If it already has this project, do nothing.
   - If it has any other project, preserve that association. Never move it during formatting; report the mismatch for user review.

6. **Improve the description only when it becomes materially clearer.** Start from the full current description and preserve the issue's original intent, requested scope, facts, links, and acceptance criteria.
   - Use the `## Summary`, `## Details`, and `## Acceptance Criteria` structure from `workflows/linear/create-issue.md` when it improves readability. Omit a section only when its content is genuinely unknowable; never add filler.
   - Correct grammar, remove accidental repetition, and reorganize existing information for clarity.
   - Add context only when it is directly supported by the issue, its linked evidence, or verified repository evidence. Do not turn an inference into a requirement.
   - Preserve client-provided copy, quotations, URLs, image references, and exact values verbatim unless the user explicitly asked to edit them.
   - Never invent requirements, silently broaden or narrow scope, change acceptance meaning, or replace ambiguity with a guess.
   - If the existing description is already clear, or a safe improvement is not possible, leave it unchanged.

7. **Build the minimal update for each issue.** Compare the canonical title, assessed estimate, desired project, and clarified description with the current values. Include only changed fields. Never change `state`, `priority`, `labels`, `assignee`, `delegate`, dates, cycle, milestone, relationships, links, or releases in this workflow.

8. **Apply updates with `save_issue`.** For each issue that has at least one changed field, make one `save_issue` call with `id=<issue identifier>` and the minimal combination of `title`, `estimate`, `project`, and/or `description`. Do not make no-op writes. If one update fails, record the failure and continue with the remaining independent issues.

9. **Report the result.** Group issues into:
   - **Updated** — identifier plus each old → new field value.
   - **Already formatted** — no changes required.
   - **Skipped / needs input** — field and concise reason.
   - **Failed** — attempted change and returned error.

Do not claim an issue was updated unless `save_issue` succeeded.
