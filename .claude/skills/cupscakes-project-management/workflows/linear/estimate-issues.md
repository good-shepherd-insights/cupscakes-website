# Workflow: Estimate Issues

## Steps

1. **Resolve the issue set.** Use the named identifiers, or list the requested open `CUP` issues. Do not change unrelated fields.
2. **Read enough evidence.** Inspect the full title, description, acceptance criteria, current estimate, linked PRs, and repository files when implementation scope is concrete.
3. **Assess implementation complexity, not priority.** Consider effort, uncertainty, integration surface, branching, and verification burden.
4. **Use only the team's Fibonacci scale:** `1`, `2`, `3`, `5`, or `8`.
   - `1`: trivial, isolated change
   - `2`: small localized change
   - `3`: moderate multi-file or integration change
   - `5`: broad or cross-cutting change with meaningful regression risk
   - `8`: very large or uncertain; usually split first
5. **Update only the estimate.** Use `save_issue` with the issue identifier and estimate. Preserve state, priority, labels, project, assignee, relationships, and dates.
6. **Report evidence and gaps.** Distinguish updated issues, unchanged estimates, and issues that could not be responsibly sized.
