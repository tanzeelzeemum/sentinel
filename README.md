# Sentinel Academic Case Management

Sentinel is an academic demonstration project for secure case management, incident reporting, and alert review. It uses fictional demonstration data only. Do not store real classified information, private intelligence records, or real private-person data in this project.

## Technology Stack

- HTML and responsive React views
- React JS with React Router
- Tailwind CSS through the Vite Tailwind plugin
- Node.js, Express, and Mongoose
- MongoDB Atlas persistence
- Firebase Authentication and Firebase Admin token verification

## Features

- Firebase registration, login, logout, and protected routes
- MongoDB-backed users, profiles, cases, alerts, and incident reports
- Role-based access for admin, officer, and analyst users
- Case creation, editing, details, status workflow, notes, assignment, and threat assessment
- Alert synchronization for high and critical cases
- Incident report CRUD linked to existing cases
- Dashboard statistics and recent activity from MongoDB
- Responsive sidebar, tables, forms, filters, and dashboard cards

## User Roles

- Admin: can view, create, edit, delete, assign, and manage all cases and reports.
- Officer: can create cases and reports for authorized cases, and edit/delete reports they submitted.
- Analyst: can view authorized analytical data and reports, but cannot create, edit, or delete incident reports.

Authorization roles are stored in MongoDB and are not editable from the Profile page.

## User Flow

1. Login with Firebase.
2. Review the Dashboard.
3. Open or create a Case.
4. Add an Incident Report from Case Details or Reports.
5. Review threat levels and Alerts.
6. Update safe Profile fields.

## Local Installation

```bash
npm install
```

## Environment Variables

Create a local `.env` file using names from `.env.example`. Use variable names only in documentation and never commit real values.

Common variables include:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `MONGODB_URI`
- `BOOTSTRAP_ADMIN_EMAILS`
- `CLIENT_URL`
- `PORT`

## Commands

Backend:

```bash
npm run server
```

Frontend:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

## MongoDB and Firebase Setup

Configure Firebase Authentication for email/password sign-in. Configure Firebase Admin credentials on the backend so bearer tokens can be verified. Configure MongoDB Atlas with a database user and place the connection string in `MONGODB_URI`.

## Main Routes

- `/dashboard`
- `/cases`
- `/cases/new`
- `/cases/:id`
- `/cases/:id/edit`
- `/reports`
- `/reports/new`
- `/reports/:id`
- `/reports/:id/edit`
- `/alerts`
- `/profile`

## Responsive Design

The interface is designed for mobile, tablet, laptop, and desktop widths. The sidebar collapses on small screens, filters and forms stack cleanly, dashboard cards wrap, and large tables remain accessible with horizontal scrolling.

## Security Notes

Protected APIs require Firebase bearer-token authentication. Backend authorization uses the canonical MongoDB user role and does not trust role, ownership, author, or assignment values sent by the frontend. Secret values, Firebase private keys, database passwords, and authorization headers must never be logged, committed, or displayed.
