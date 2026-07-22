---
name: review
description: Run the Cups & Cakes GitHub pull-request review workflow.
argument-hint: "PR number, URL, or current-PR context"
user-invocable: true
disable-model-invocation: false
---

Run the repository's review workflow for the requested pull request.

1. Read `.claude/skills/cupscakes-project-management/workflows/github/review-comments.md` and follow it exactly.
2. Resolve the repository and PR from `$ARGUMENTS`; if no argument is provided, use the current branch's PR.
3. Inspect unresolved review threads, distinguish actionable feedback, and apply valid fixes on the same PR branch.
4. Push fixes, resolve only addressed threads, and re-fetch the threads before reporting completion.

User context:

```text
$ARGUMENTS
```
