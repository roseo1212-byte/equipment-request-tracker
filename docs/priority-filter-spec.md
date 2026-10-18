# Priority Filter Specification

## Goal

Help managers quickly find and resolve equipment requests that need attention by showing requests in date-first order, highlighting urgency, and providing filters and search.

## User Need

Managers need a faster way to focus on equipment requests that need attention. They need to identify approaching or overdue needs, narrow the list, and remove fulfilled or canceled requests from the active workload while retaining a history.

## Functional Rules

1. The attention list contains active requests. Existing requests without a status are treated as active.
2. Sort requests by needed-by date ascending, then priority (High, Normal, Low), then submission time ascending. Requests with identical values retain their existing relative order.
3. Display a text priority label for every request. Give High priority stronger visual highlighting.
4. An active request is overdue when its needed-by date is before the current local calendar date. Show an "Overdue" label. A request due today is not overdue. Overdue requests remain active until fulfilled or canceled.
5. Provide filters for priority, overdue status, and needed-by date, plus text search across requester name and equipment.
6. For a testable interpretation of "date," use an inclusive needed-by date range with optional start and end dates. An omitted boundary is unrestricted. Reject a start date after the end date with a visible message.
7. Priority filtering offers All, High, Normal, and Low. Overdue filtering offers All, Overdue, and Not overdue. Text search is case-insensitive, ignores leading and trailing whitespace, and matches a substring in either requester name or equipment.
8. Combine enabled filters and search with AND: a request must satisfy each selected filter and the search condition. Preserve the date-first sorting in the results.
9. Initially show all active requests. Provide "Clear filters" to reset filters and search and show all active requests again.
10. When active requests exist but none match, display "No matching requests." When there are no active requests, display "No active requests."
11. Each active request has "Mark fulfilled" and "Cancel request" buttons. Either action removes it from the attention list and stores it in history with the appropriate status, retaining its original request information.
12. Provide a history view that identifies fulfilled and canceled requests. Record the action timestamp when an active request is fulfilled or canceled and display it in local date and time as "Fulfilled on" or "Canceled on." Existing history without a timestamp displays "Date not recorded"; do not invent historical dates. Status, timestamps, and history persist after page refresh. Sort history by newest action timestamp first, with missing or invalid action dates last. Break matching action timestamps, including missing dates, by newest submission first. Exact ties retain their existing relative order. History search is out of scope.
13. Require requester name, department, equipment, a valid needed-by date, business reason, and a priority of High, Normal, or Low. Prevent incomplete submissions and identify the fields requiring attention. Preserve the existing Normal default.
14. Allow duplicate requests because similar requests may represent separate needs.
15. Unavailable equipment does not automatically remove a request from the attention list. The request remains active for manager follow-up.

16. Provide New request and Current workload view buttons; Current workload opens by default. Show only the selected section, preserve drafts and filter selections when switching, and display the selected button white and the unselected button purple.

The date-range and search-matching details above are specification defaults used to make the user's requested date filter and search testable.

## Constraints

- Use the existing plain HTML, CSS, and JavaScript application and local browser storage. Do not add frameworks, external services, or production dependencies.
- Preserve existing request data. Requests without priority continue to use Normal; requests without status remain active.
- Filtering and search must not modify stored request information.
- Use visible text labels as well as color to communicate priority and overdue status.
- Keep filters, search, and action buttons keyboard accessible with visible labels and focus indicators.
- Render user-provided content safely.
- Scope changes to the specified behavior; retain the existing request form and unrelated interface behavior.
- This specification describes manager behavior without introducing authentication or role-based permission enforcement.

## Acceptance Criteria

1. Given requests with different needed-by dates, the earliest date appears first even when its priority is lower.
2. Given requests with the same needed-by date, High appears before Normal, which appears before Low.
3. Given requests with the same date and priority, the oldest submission appears first.
4. Every active request displays its priority as text, and High requests have stronger visual highlighting.
5. Given yesterday, today, and tomorrow as needed-by dates, only yesterday receives an "Overdue" label. It stays active until fulfilled or canceled.
6. Selecting a priority shows only active requests with that priority. Selecting Overdue or Not overdue shows only the corresponding active requests.
7. Setting a date range includes requests on both boundary dates and excludes requests outside the range. A single boundary works independently. A reversed range produces a visible error.
8. Searching with mixed case or surrounding whitespace finds matching requester names or equipment names using substring matching.
9. Combining search, priority, overdue, and date filters returns only requests satisfying every condition, in the specified sorting order.
10. A search or filter combination with no matches displays "No matching requests." Clearing filters restores all active requests in the specified order without changing stored data.
11. Selecting "Mark fulfilled" removes that request from the attention list and shows it in history as fulfilled with its original information.
12. Selecting "Cancel request" removes that request from the attention list and shows it in history as canceled with its original information.
13. After refreshing, active requests, their statuses, and history remain available and correct. Newly fulfilled/canceled requests show the appropriate action date and time, unchanged after refresh. Existing history without an action timestamp shows "Date not recorded." Resolving another request must not change earlier timestamps. Verify newest actions appear first, undated entries appear last, and submission time descending breaks ties.
14. Missing required information prevents submission and produces field-specific guidance. Duplicate valid requests can both be submitted.
15. An active request for unavailable equipment remains visible unless a manager fulfills or cancels it; no availability lookup is required.
16. Existing stored requests remain readable and retain their information, with Normal priority or active status supplied when those fields are absent.
17. All acceptance criteria are checked, automated business and storage tests pass with `npm test`, and the changed behavior is verified in the browser before implementation is considered complete.

## Out of Scope

- Adding Extreme, Urgent, or other priority levels, or automatically assigning priority.
- Authentication, manager accounts, and role-based access controls.
- Inventory or equipment-availability tracking.
- Approval workflows, notifications, reminders, and escalation.
- Automatic duplicate detection or merging.
- Reopening, editing, or permanently deleting fulfilled or canceled requests.
- Shared server storage, cross-device synchronization, and multi-user collaboration.
- Unrelated interface redesign.

## Verification Results

1. Passed
2. Passed
3. Passed
4. Passed
5. Passed
6. Passed
7. Passed
8. Passed
9. Passed
10. Passed
11. Passed
12. Passed
13. Passed
14. Passed
15. Passed
16. Passed
17. Passed
