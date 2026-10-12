# Scholarship components

All views use the shared state owned by `StudentScholarship.jsx`.

- `OverviewTab.jsx` shows student information, application statistics and decisions, the next deadline, and quick actions.
- `ScholarshipListTab.jsx` and `ScholarshipCard.jsx` show/search/filter scholarships and manage the list-to-submission view flow.
- `ScholarshipDetails.jsx` shows scholarship criteria and application dates.
- `ApplicationForm.jsx` and `FileUploadField.jsx` manage the local application draft and file selections.
- `ApplicationSubmitted.jsx` confirms a successful submission.
- `MyApplicationsTab.jsx` and `ApplicationItem.jsx` show/filter applications, expand submitted details, and provide temporary dev-only decisions.
- `ScholarshipHeader.jsx` provides navigation between the four tabs.
- `data.js` contains the mock scholarships, applications, and notifications.
- `StudentScholarship.jsx` owns the shared state and renders the active tab.
