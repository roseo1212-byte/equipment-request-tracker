# Priority filter verification

## Implementation plan and scope

1. Add pure sorting, filtering, overdue, validation, and resolution functions to request-store.js.
2. Add labeled filters, search, status actions, and history to the existing interface.
3. Preserve the existing storage key and request fields; absent status means active.
4. Test business/storage behavior and verify the interface in a browser.

Action timestamps are now required: fulfill and cancel a fresh request, verify the local action date/time in history, and refresh to confirm it stays unchanged. Existing history shows "Date not recorded." History search is excluded.

## Automated results

All 15 tests pass with node --test, the exact command configured by npm test.
The environment does not provide npm, so npm test itself could not be invoked.
Both application modules pass node --check.

The user completed the guided browser walkthrough and confirmed acceptance criteria 1–17 passed. View switching, draft preservation, selected-button colors, single-click Clear filters, action timestamps, history sorting, keyboard controls, and narrow-screen usability were also confirmed. These browser results are user-reported; agent browser automation was unavailable.

## Acceptance criterion test mapping

Run npm start and open http://127.0.0.1:8000 in a browser. Use disposable browser
storage or a separate profile. Create several requests with different dates,
priorities, requester names, and equipment names. For overdue and legacy cases,
seed local storage in that test profile or let a request's date pass.

| AC | How to test | Verification |
| --- | --- | --- |
| 1 | Add Low due earlier than High; confirm Low appears first. | Automated sorting test passes; user browser check passed. |
| 2 | Add High, Normal, Low due on the same day; confirm that order. | Automated sorting test passes; user browser check passed. |
| 3 | Add two requests with matching date/priority; confirm oldest submission first. Exact ties retain source order. | Automated sorting test passes; user browser check passed. |
| 4 | Inspect every priority label and compare High highlighting with Normal/Low. | User browser check passed. |
| 5 | Use yesterday, today, tomorrow; only yesterday is Overdue, and remains active until resolved. | Automated overdue test passes; user label check passed. |
| 6 | Select each priority and overdue choice; verify only matching active requests. | Automated filter test passes; user browser check passed. |
| 7 | Filter inclusive start/end dates, each boundary alone, then reversed dates; verify visible error. | Automated range test passes; user browser check passed. |
| 8 | Search partial requester and equipment names with mixed case and outer spaces. | Automated search test passes; user browser check passed. |
| 9 | Combine every filter and search; verify AND matching and date-first order. | Automated combined filter test passes; user browser check passed. |
| 10 | Search nonsense, see No matching requests, then Clear filters; compare stored data before/after. With no active requests, see No active requests. | Automated nonmutation/no-match checks pass; user browser check passed. |
| 11 | Mark fulfilled; confirm removal and original details plus Fulfilled in Request history. | Automated transition test passes; user browser check passed. |
| 12 | Cancel request; confirm removal and original details plus Canceled in Request history. | Automated transition test passes; user browser check passed. |
| 13 | Refresh after both actions; verify active list and both history records. | Automated storage round-trip passes; user browser check passed. |
| 14 | Submit blank fields or invalid date; verify field-specific guidance. Submit the same valid request twice; both remain. | Automated validation/duplicate tests pass; user browser check passed. |
| 15 | Add an unavailable-equipment request; confirm it stays active until manually resolved. | Automated active-list test passes; user browser check passed. |
| 16 | Load legacy records without priority/status; confirm Normal and active, original fields retained after saving. | Existing legacy and new storage tests pass; user browser check passed. |
| 17 | Run npm test and perform the browser checks above. Tab through all controls and verify labels, focus indicators, action focus recovery, and narrow-screen usability. | 15 automated tests pass via node --test; user browser checks passed; literal npm command unavailable in the agent environment. |

## Changed files

- src/request-store.js: pure business rules and calendar-date validation.
- src/app.js: filters, labels, history, status actions, field-specific errors.
- index.html: accessible controls, actions column, and history view.
- styles.css: focused styling for urgency, errors, actions, and history.
- tests/priority-filter.test.js: business and storage regression coverage.
- docs/priority-filter-test-guide.md: this verification guide.

History sorting check: resolve two requests in sequence; the latest action appears first. Older undated entries appear last. Matching action dates use newest submission first. Automated coverage is in the history sorting test.

