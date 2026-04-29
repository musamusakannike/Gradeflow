# GradeFlow Project Overview

A production-grade Node.js/Express/TypeScript backend designed for managing Nigerian secondary schools. It features robust multi-tenancy support, academic management, automated grading, fee tracking, and seamless payment integrations.

---

## 🛠 Technology Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | Node.js + TypeScript |
| **Framework** | Express.js |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT + bcryptjs + Firebase Admin (Google Auth) |
| **File Storage** | Cloudflare R2 (AWS S3 SDK) |
| **Payments** | Paystack (NGN) |
| **Email** | Resend |
| **Notifications** | Expo Server SDK (Push Notifications) |
| **Validation** | Zod |
| **Security** | Helmet, CORS, Rate Limiting |
| **Logging** | Morgan + Winston |

---

## 📂 Project Structure

```text
server/
├── src/
│   ├── config/             # Third-party service configurations
│   ├── constants/          # Enums, roles, and static configurations
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, Multi-tenancy, Error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic & external integrations
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Helper functions & utilities
│   ├── validators/         # Zod validation schemas
│   ├── app.ts              # Express application setup
│   └── server.ts           # Entry point
├── scripts/                # Database seeding and maintenance
├── postman/                # API collection and environments
└── docs/                   # Additional documentation
```

---

## 🏗 Database Schema Design

### 1. Core Entities
- **School**: The root of the multi-tenancy structure. Contains branding and subscription details.
- **User**: Unified model for all stakeholders (Admins, Teachers, Bursars, Students, Parents).
- **Student**: Extended profile for student-specific data (Admission #, Guardian info, Status).

### 2. Academic Structure
- **Academic Session**: High-level grouping (e.g., "2024/2025").
- **Term**: Sub-division of sessions (1st, 2nd, 3rd Term).
- **Class**: Grade levels (JSS1 - SS3) with capacity management.
- **Subject**: Academic subjects (Mathematics, English, etc.).
- **ClassSubject**: Assignment junction linking Class + Subject + Teacher.

### 3. Grading & Finance
- **Score**: Records Test 1, Test 2, and Exam scores. Calculates totals and grades.
- **FeeStatus**: Tracks student payment progress per term.
- **Payment**: Audit trail for Paystack transactions and manual entries.

---

## 🔐 User Roles & Permissions

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Super Admin** | Platform Owner | Manage all schools, platform settings. |
| **School Admin** | School Owner | Full school control, staff/student management. |
| **Teacher** | Academic Staff | Enter scores, manage assigned classes/subjects. |
| **Bursar** | Financial Staff | Manage fees, record payments, view financial reports. |
| **Student** | Learner | View profile, check results (if fees are paid). |
| **Parent** | Guardian | Monitor child's academic and financial status. |

---

## 🚀 Key Features Implementation

### 1. Multi-Tenancy (Isolation)
- All models contain a `schoolId` field.
- `school.middleware.ts` extracts the school context from the JWT.
- Database queries are automatically scoped to the authenticated school.

### 2. Automated Grading System
Adheres to the Nigerian standard grading scale:
- **A (70-100)**: Excellent
- **B (60-69)**: Very Good
- **C (50-59)**: Good
- **D (45-49)**: Fair
- **E (40-44)**: Pass
- **F (0-39)**: Fail

### 3. Result Gating
Results are programmatically locked. A student can only view their terminal report if their `FeeStatus` for that specific term is marked as **'paid'**.

### 4. Smart Student IDs
Generated automatically using the format: `{SCHOOL_CODE}/{YEAR}/{SEQUENCE}` (e.g., `GSS/2024/001`).

---

## 📡 API Endpoints (Summary)

### Authentication
- `POST /auth/register-school`: Onboard a new school and its first admin.
- `POST /auth/login`: Issue JWT access and refresh tokens.
- `POST /auth/google`: Firebase-backed social authentication.

### Academic Management
- `CRUD /sessions` & `/terms`: Manage the academic calendar.
- `CRUD /classes` & `/subjects`: Define the school structure.
- `POST /subjects/assign`: Assign teachers to subjects within specific classes.

### Student & Staff
- `POST /students/bulk-upload`: Efficiently onboard students via CSV.
- `GET /teachers/:id/classes`: Specialized view for teacher workloads.

### Scores & Results
- `POST /scores/bulk`: Quick entry for terminal assessments.
- `POST /results/compile/:termId`: Finalize and lock results for a term.

### Payments & Fees
- `POST /payments/initialize`: Start a Paystack transaction.
- `POST /payments/webhook`: Handle asynchronous payment notifications.
- `GET /fees/status/:studentId`: Check financial standing.

---

## 🛠 Environment Configuration

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Connection string for MongoDB Atlas/Local. |
| `JWT_SECRET` | Secret key for signing access tokens. |
| `R2_*` | Cloudflare R2 credentials for file storage. |
| `PAYSTACK_*` | API keys for payment processing. |
| `FIREBASE_*` | Service account details for Google Auth. |
| `EXPO_ACCESS_TOKEN` | Token for sending push notifications. |

---

## 📈 Roadmap & Implementation Phases

1.  **Phase 1: Core Foundation**: Multi-tenancy, Auth, Base Models.
2.  **Phase 2: Academic Setup**: Sessions, Terms, Classes, and Assignments.
3.  **Phase 3: Student Lifecycle**: Profiles, Bulk Upload, ID Generation.
4.  **Phase 4: Assessment**: Score entry, Automated Grading, Result Compilation.
5.  **Phase 5: Finance**: Fee tracking and Paystack Integration.
6.  **Phase 6: Engagement**: Email/Push Notifications and File Storage (R2).
7.  **Phase 7: Optimization**: Rate limiting, Logging, and Performance tuning.

---

## 📖 Documentation Standards

### README.md Structure
Every module or root README should cover:
- **Features**: Complete list of system capabilities.
- **Prerequisites**: Required software (Node.js, MongoDB, etc.).
- **Installation**: Step-by-step setup guide.
- **Environment Variables**: Detailed explanation of each variable.
- **API Reference**: Overview with links to the Postman collection.
- **User Roles**: Permission levels explained in detail.

### Postman Collection Organization
The collection in `postman/GradeFlow.postman_collection.json` is organized by module:
- **Auth**: Registration, Login, Social Auth, Password Management.
- **Academic**: Sessions, Terms, Classes, Subjects.
- **Users**: Staff and Student management.
- **Assessments**: Scores entry and Result compilation.
- **Finance**: Fee tracking and Payment processing.

---

## 📝 Implementation Notes

- **Backend-only**: This project resides in the `server/` directory.
- **Data Integrity**: Multi-tenancy is enforced at the database layer via `schoolId`.
- **Calculated Fields**: Scores and grades are computed automatically on save/update.
- **Security**: Result viewing is programmatically gated by fee status.
- **Integration**: Firebase is used for token verification; Expo for mobile notifications.