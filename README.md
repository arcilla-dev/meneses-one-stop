# Meneses Campus One-Stop

**Everything you need, in one place.**

Meneses Campus One-Stop is the centralized online student service portal for **Bulacan State University — Meneses Campus**. Instead of lining up across multiple campus offices, students can submit and track service requests online, while office administrators and superadmins review, process, and respond to transactions from a unified dashboard.

---

## Table of Contents

- [Features](#features)
- [User Roles & Access Control](#user-roles--access-control)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database & Storage Overview](#database--storage-overview)
- [Development Conventions](#development-conventions)
- [Developers](#developers)

---

## Features

### Student Portal

- **Registrar:** Request official documents (Certificate of Registration, Report of Grades, Good Moral Certificate, or Other with file attachments), submit add/remove subject requests with reasons, and view current enrolled subjects.
- **Infirmary:** Book clinic appointments (Consultation, Vital Signs, Dental, Medical Certificate, or Other) on weekday clinic schedules with automatic slot-overlap checks, and manage or cancel upcoming bookings.
- **Scholarship:** Browse active scholarship programs and submit applications with GPA details and supporting document uploads.
- **Local Student Council (LSC):** Submit print service requests (1–100 pages; 1–5 files in PDF, DOCX, JPG, or PNG up to 10 MB each), track print progress from submission to claiming[cite: 1, 3], and cancel pending requests.
- **Announcements:** Read, search, and filter campus-wide announcements across all offices (`General`, `Enrollment`, `Infirmary`, `Scholarship`, `Printing`).
- **Notifications:** Receive real-time status alerts per module whenever a document, subject change, clinic appointment, scholarship application, or print request is updated.

### Admin & Superadmin Dashboard

- **Registrar Management:** Review and approve/reject add/remove subject requests (automatically updating `student_subjects` enrollment records via RPC) and inspect document requests with status history.
- **Infirmary Management:** Approve or reject appointment requests, view clinic schedules via calendar and status tabs (with automatic completion of past appointments), and manage available clinic services.
- **Scholarship Management:** Review student applications with temporary signed document links, approve or reject submissions, and create, edit, or toggle active scholarship programs.
- **LSC Management:** Process or reject print requests with signed file previews and configure available LSC printing services.
- **Announcements Management:** Post announcements tagged with the admin's assigned office, edit posts within a 1-hour window, and remove outdated notices.
- **Superadmin Overview:** Access cross-office summaries across all four campus offices and provision new admin accounts.

---

## User Roles & Access Control

Access permissions are enforced directly at the database level via **Supabase Row Level Security (RLS)** using the `public.is_staff()` helper function rather than client-side route hiding:

| Role | Database Assignment | Access Scope |
| :--- | :--- | :--- |
| **Student** | Default authenticated user (`profiles.role = 'student'`) | Student portal routes; read/create access scoped strictly to their own rows (`auth.uid()`). |
| **Admin** | `profiles.role = 'admin'` with `profiles.office` set (`registrar`, `infirmary`, `scholarship`, or `lsc`) | Admin dashboard and management pages for their assigned office. |
| **Superadmin** | `profiles.role = 'superadmin'` | Full admin access across all offices, cross-office overview, and staff account creation. |

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router) & TypeScript
- **Styling & UI:** Tailwind CSS, custom modal CSS (`styles/modals.css`), `lucide-react` icons
- **Typography:** `next/font/google` (`Dela Gothic One`, `Great Vibes`)
- **Backend & Auth:** [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Storage, RPCs, Database Triggers, `@supabase/ssr`)

---

## Project Structure

```text
├── app/                          # Next.js App Router pages (student routes & /admin routes)
│   ├── registrar/                # Student Registrar portal (overview, document requests, subjects)
│   ├── infirmary/                # Student Infirmary portal (overview, booking, appointments)
│   ├── scholarship/              # Student Scholarship portal
│   ├── lsc/                      # Student LSC portal (print requests, rates, tracking)
│   └── admin/                    # Office-specific admin dashboards, announcements & superadmin views
├── components/
│   ├── admin/                    # Shared admin modals, stat cards, and per-office UI sections
│   ├── registrar/                # Student Registrar tabs and config-driven modal components
│   ├── infirmary/                # Student Infirmary schedule form and appointment list components
│   └── lsc/                      # Student LSC print request form, rates table, and request items
├── contexts/
│   └── UserProfileContext.tsx    # Authenticated student profile state provider
├── lib/
│   ├── adminApi.ts               # Shared admin helpers, status updates, and signed URL generators
│   ├── adminRegistrarApi.ts      # Registrar data mappers and subject resolution wrappers
│   ├── adminInfirmaryApi.ts      # Infirmary request, schedule, and service API helpers
│   ├── adminScholarshipApi.ts    # Scholarship application and program management helpers
│   ├── adminLscApi.ts            # LSC print request and service management helpers
│   └── announcementsApi.ts       # Shared announcement queries, creation, 1-hour edit & delete
├── db/                     # SQL schemas, RLS policies, triggers, and RPC functions
└── public/                       # Static assets (campus-bg.png, greeting-bg.png, etc.)
```

---

## Getting Started

### Prerequisites

- **Node.js** and a package manager (`npm`, `yarn`, `pnpm`, or `bun`)
- A **Supabase** project

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-side only (used exclusively in server routes for superadmin account creation)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **Security Note:** Never import or expose the service-role client inside `'use client'` files.

### 3. Set Up Supabase Database & Storage

The database schema is organized into sequential, Flyway-style versioned migrations (`migration_1*.sql`, `migration_2*.sql`, etc.) so base tables and shared helpers (`is_staff()`, `stamp_handler()`) are applied before dependent office policies and triggers

Apply the migrations in ascending numerical order, the Supabase CLI, or the Supabase SQL Editor.

Next, create the following **private** Supabase Storage buckets:
- `request-attachments` (Registrar document uploads)
- `scholarship-documents` (Scholarship application requirements)
- `print-files` (LSC print service files)

### 4. Provision the First Staff Account

Promote an existing user in the Supabase SQL Editor to configure your initial admin or superadmin:

```sql
update public.profiles
set role = 'superadmin', office = 'Administration'
where id = (select id from auth.users where email = 'admin@example.com');
```

### 5. Run the Development Server

```bash
npm run dev
# or yarn dev / pnpm dev / bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database & Storage Overview

| Module | Core Tables | Storage Bucket | Automated Triggers / RPCs |
| :--- | :--- | :--- | :--- |
| **Registrar** | `registrar_requests`, `subject_changes`, `subjects`, `student_subjects` | `request-attachments` | `resolve_subject_change()`, `notify_on_request`, `trg_stamp_handler` |
| **Infirmary** | `appointments`, `services` | — | `notify_on_appointment()`, `complete_past_appointments()` |
| **Scholarship** | `scholarships`, `applications` | `scholarship-documents` | `notify_on_application` |
| **LSC** | `print_requests`, `lsc_rates`, `lsc_services` | `print-files` | `lsc_notify_request()`, server-side request numbering (`LSC-YYYY-00001`) |
| **Announcements** | `announcements`, `announcement_reads` | — | `announcements_before_insert()`, `announcements_before_update()` |

---

## Development Conventions

- **Server-Authoritative State:** The client never determines request statuses, total bills, or request numbers; these are computed and enforced by PostgreSQL functions, triggers, and constraints.
- **Consistent Date Formatting:** Dates are stored in ISO format (`YYYY-MM-DD`) and formatted strictly at the UI layer.
- **Error Propagation:** API helpers in `lib/` throw standard `Error(message)` instances, which page and modal components catch and display directly to the user.
- **Client Initialization:** Always import the browser Supabase client from `@/utils/supabase/client` to maintain consistent session state across routes.

---

## Developers

Built for **Bulacan State University — Meneses Campus** by:

- **Josh Nathaniel Arcilla**
- **Cloiez Veniz Belmonte**
- **Hazel Rose De Guzman**
- **Jerome Lagarde**