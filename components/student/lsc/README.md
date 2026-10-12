# Learning Support Center (LSC)

- `data.js` exports placeholder print configuration: `PAPER_SIZES`, `PRINT_RATES`, `COLOR_OPTIONS`, `LAYOUT_OPTIONS`, `PRINT_LIMITS`, `REQUEST_STATUSES`, `LSC_PAYMENT_NOTE`, `LSC_CLAIM_NOTE`, and `LSC_OFFICE_HOURS`. Each placeholder is marked for confirmation with LSC officers and eventual admin/Supabase data.
- `data.js` also exports `MOCK_PRINT_REQUESTS`, with sample requests and totals calculated by `computeBill`.
- `utils.js` exports `computeBill(paperSize, color, pages)` and `formatPeso(amount)`. Bills are informational estimates only; payment is made at the LSC office.
- `StudentLSC.jsx` owns `printRequests`, request add/cancel/status handlers, and notifications. It shares request state with the Services, My Requests, and Overview tabs.
- `ServicesTab.jsx` combines `PrintRequestForm.jsx` and `FeaturedServices.jsx` to collect mock print requests and show rates from the placeholder configuration.
- `MyRequestsTab.jsx` filters/searches shared print requests; `PrintRequestItem.jsx` displays request details, cancellation, and the labeled development-only status control.
- `OverviewTab.jsx` shows student information, request/announcement summaries, ready-for-claiming banners, service information, and quick actions.
- `LSCHeader.jsx` provides Overview, Services, My Requests, and Announcements navigation.
- `AnnouncementsTab.jsx` and `AnnouncementItem.jsx` display read-only mock announcements.
- `app/lsc/page.jsx` mounts the student LSC view and retains the admin-role TODO.
- When file uploads are implemented, store files in a private Supabase Storage bucket with Row Level Security so a student can access only their own files.
