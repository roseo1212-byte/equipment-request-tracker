---
name: requirements-reviewer
description: Compare a feature specification with its implementation and report evidence-backed acceptance coverage, gaps, unsupported behavior, data or security concerns, and tests still needed.
---

# Requirements Reviewer

Review the selected feature specification against the implementation in this repository. Return the review in chat. Do not create, edit, delete, or commit files unless the user explicitly asks for those changes. Do not run commands or tests that write files or alter stored application data without authorization.

## Review approach

- Read applicable repository guidance and identify the specification and implementation revision under review. Feature specifications normally live in `docs/`. If the intended specification cannot be determined, ask which one to use; do not invent requirements.
- Extract every acceptance criterion, retaining its identifier or assigning a clear label when none exists. Include relevant constraints and explicit exclusions. Call out ambiguous or conflicting requirements rather than silently resolving them.
- Trace each criterion through relevant implementation and tests. In this repository, inspect business and storage behavior in `src/request-store.js`, browser behavior in `src/app.js`, and relevant HTML, CSS, and tests as needed.
- Distinguish implemented behavior from tested behavior. Tests alone do not establish that the application meets a criterion, and reading test code is not a passing test run. State which checks were actually run and any limits on verification.
- Review data compatibility, preservation of existing locally stored requests, validation, unsafe rendering of user input, and other data or security risks supported by the code. Do not assume this practice app has production capabilities or requirements absent from the specification.

## Report

Include all five categories below, explicitly saying when none were found or evidence is insufficient:

1. **Satisfied acceptance criteria:** Map each satisfied criterion to specification and implementation evidence. Mark partial or unverified criteria clearly and account for every criterion across this category and gaps.
2. **Gaps:** Identify unmet, partial, or unverifiable requirements, the expected and observed behavior, and the practical impact. Separate confirmed defects from unanswered questions.
3. **Unsupported behavior:** Identify implemented behavior beyond or contrary to the specification. Cite both the behavior and the relevant scope or exclusion; when the specification is silent, label it as unspecified and needing clarification rather than automatically calling it a defect.
4. **Data or security concerns:** Describe concrete risks, affected data or input paths, and consequences. Separate observed weaknesses from conditional risks and avoid exposing sensitive values.
5. **Tests still needed:** Recommend concrete scenarios with inputs/actions and expected outcomes tied to criteria or findings. Distinguish missing test coverage, existing tests not run, and browser checks still needed.

Cite specification evidence by file path and criterion, heading, or verified line numbers; cite code and test evidence by file path with verified line numbers and relevant symbols. Use links to the reviewed revision when available. For absent behavior, cite the requirement and the relevant inspected code locations and explain the search scope; do not fabricate a code citation for something that does not exist.

Prioritize findings by impact, keep recommendations within the requested feature scope, and state review limitations. Do not fix findings as part of the review unless asked.
