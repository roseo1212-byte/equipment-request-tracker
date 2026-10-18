# Priority filter verification

## Implementation plan and scope

1. Add pure sorting, filtering, overdue, validation, and resolution functions to request-store.js.
2. Add labeled filters, search, status actions, and history to the existing interface.
3. Preserve the existing storage key and request fields; absent status means active.
4. Test business/storage behavior and verify the interface in a browser.

No completion timestamps were added because the saved specification does not require them.

## Automated results

All 14 tests pass with node --test, the exact command configured by npm test.
The environment does not provide npm, so npm test itself could not be invoked.
Both application modules pass node --check.

Browser checks are pending: the in-app browser could not reach localhost, and
the installed Edge browser exited during sandbox launch. Automated tests establish
business and storage behavior but do not establish browser rendering or interaction.

## Acceptance criterion test mapping

Run npm start and open http://127.0.0.1:8000 in a browser. Use disposable browser
storage or a separate profile. Create several requests with different dates,
priorities, requester names, and equipment names. For overdue and legacy cases,
seed local storage in that test profile or let a request's date pass.

| AC | How to test | Verification |
| --- | --- | --- |
| 1 | Add Low due earlier than High; confirm Low appears first. | Automated sorting test passes; browser pending. |
| 2 | Add High, Normal, Low due on the same day; confirm that order. | Automated sorting test passes; browser pending. |
| 3 | Add two requests with matching date/priority; confirm oldest submission first. Exact ties retain source order. | Automated sorting test passes; browser pending. |
| 4 | Inspect every priority label and compare High highlighting with Normal/Low. | Browser pending. |
| 5 | Use yesterday, today, tomorrow; only yesterday is Overdue, and remains active until resolved. | Automated overdue test passes; label check pending. |
| 6 | Select each priority and overdue choice; verify only matching active requests. | Automated filter test passes; browser pending. |
| 7 | Filter inclusive start/end dates, each boundary alone, then reversed dates; verify visible error. | Automated range test passes; browser pending. |
| 8 | Search partial requester and equipment names with mixed case and outer spaces. | Automated search test passes; browser pending. |
| 9 | Combine every filter and search; verify AND matching and date-first order. | Automated combined filter test passes; browser pending. |
| 10 | Search nonsense, see No matching requests, then Clear filters; compare stored data before/after. With no active requests, see No active requests. | Automated nonmutation/no-match checks pass; browser pending. |
| 11 | Mark fulfilled; confirm removal and original details plus Fulfilled in Request history. | Automated transition test passes; browser pending. |
| 12 | Cancel request; confirm removal and original details plus Canceled in Request history. | Automated transition test passes; browser pending. |
| 13 | Refresh after both actions; verify active list and both history records. | Automated storage round-trip passes; browser pending. |
| 14 | Submit blank fields or invalid date; verify field-specific guidance. Submit the same valid request twice; both remain. | Automated validation/duplicate tests pass; browser pending. |
| 15 | Add an unavailable-equipment request; confirm it stays active until manually resolved. | Automated active-list test passes; browser pending. |
| 16 | Load legacy records without priority/status; confirm Normal and active, original fields retained after saving. | Existing legacy and new storage tests pass; browser pending. |
| 17 | Run npm test and perform the browser checks above. Tab through all controls and verify labels, focus indicators, action focus recovery, and narrow-screen usability. | 14 automated tests pass via node --test; browser and literal npm command pending. |

## Changed files

- src/request-store.js: pure business rules and calendar-date validation.
- src/app.js: filters, labels, history, status actions, field-specific errors.
- index.html: accessible controls, actions column, and history view.
- styles.css: focused styling for urgency, errors, actions, and history.
- tests/priority-filter.test.js: business and storage regression coverage.
- docs/priority-filter-test-guide.md: this verification guide.
