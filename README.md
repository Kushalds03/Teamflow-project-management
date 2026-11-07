# TeamFlow — Enterprise Project Management & Collaboration Platform

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599.svg)](https://neon.tech/)
[![Vitest](https://img.shields.io/badge/Tests-269%20Passing-brightgreen.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

TeamFlow is an enterprise-grade, full-stack project management and collaboration platform engineered with modern React 19, TypeScript, Node.js, Express, Prisma ORM, and Neon PostgreSQL. Built for high-velocity software engineering organizations, it combines interactive sprint tracking, Kanban pipelines, real-time audit feeds, task discussions, and granular role-based access control (RBAC).

---

## 1. Problem Statement

Modern distributed engineering teams face significant friction coordinating across sprint milestones, managing capacity, and tracking technical debt across multiple workspaces. Existing tools are frequently bloated, expensive, or lack clean architectural separation between workspace boundaries, project roles, and auditability.

**TeamFlow solves this by delivering:**
- **Zero-Latency Interactions**: Instant optimistic UI updates backed by an asynchronous REST API and PgBouncer connection pooling.
- **Hierarchical Governance**: Strict workspace isolation with two-tier RBAC (System Roles: `ADMIN`, `USER`; Project Roles: `LEAD`, `MAINTAINER`, `CONTRIBUTOR`, `VIEWER`).
- **Comprehensive Auditability**: Automated reverse-chronological activity trails on every project milestone, task update, and member assignment.
- **Deep Collaboration**: Real-time task discussion threads and team capacity utilization analytics.

---

## 2. Core Features

### 🏢 Workspace & Project Management
- **Multi-Tenant Workspaces**: Switch smoothly between distinct organizational workspaces (`Acme Core Engineering`, `Mobile Platform Team`, `Enterprise Cloud Services`).
- **Milestone Tracking**: Comprehensive project dashboards showing completion pacing, target delivery deadlines, and category tags.
- **Team Allocation**: Add, manage, and promote project members with role escalation enforcement.
- **Project CRUD & Archival**: Real-time project creation, inline updates, and cascading deletion with confirmation safeguards.

### 📋 Task Lifecycle & Agile Workflows
- **Dual Views (List & Kanban)**: Work across high-density task overview tables or interactive 4-column Kanban boards (`To Do`, `In Progress`, `In Review`, `Done`).
- **Drag-and-Drop Pipelines**: Move cards between sprint columns with drag events or quick arrow actions; optimistic updates persist immediately to the database.
- **Task Detail Drawer**: Deep work item inspection modal with editable title, description, priority (`High`, `Medium`, `Low`), due dates, tags, and inline assignee switching.
- **Task Discussion Threads**: Threaded comments on work items with timestamp formatting, author badges, and author/admin deletion control.

### 📊 Real-Time Analytics & Audit Feeds
- **Workspace Analytics**: Aggregated completion percentages, active vs completed project counts, and team workload distribution.
- **Project-Level Metrics**: Overdue task calculations (`dueDate < now && status !== 'DONE'`), status distributions, and 7-day database-backed activity trends.
- **Activity Streams**: Reverse-chronological audit feeds with safe actor serialization (`avatarUrl`, `jobTitle`, `department`), event filtering, and pagination.

### 🔐 Security & Identity
- **HttpOnly Cookie Authentication**: Secure, cross-site request forgery resilient JWT authentication with Authorization Bearer header fallback.
- **Password Security**: Bcryptjs password hashing with configurable work factor.
- **Input Validation**: Strict Zod schemas validating request payloads and query parameters before hitting business logic.
- **One-Click Demo Logins**: Instant access to pre-configured roles (`Admin`, `Frontend Engineer`, `Backend Engineer`) for evaluation without manual credential typing.

---

## 3. Technology Stack

### Frontend Architecture
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/) with code splitting (`vendor-react`, `vendor-charts`, `vendor-icons`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Visualizations**: [Recharts v3](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend Architecture
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules & TypeScript)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma ORM v6](https://www.prisma.io/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/) with pooled connection management
- **Validation**: [Zod v4](https://zod.dev/)
- **Security**: `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `express-rate-limit`
- **Testing**: [Vitest v5](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest)

---

## 4. System Architecture & Database Design

### Clean Architectural Layers

```
TeamFlow Full-Stack Platform
│
├── client/ (React 19 SPA)
│   ├── src/services/       # Strongly typed REST API client & services
│   ├── src/utils/mappers/  # Domain mappers bridging DB enums & UI models
│   ├── src/context/        # AppContext with optimistic state & offline fallback
│   ├── src/components/     # Modular UI, modals, layouts, and dashboard charts
│   └── src/pages/          # Route views (Dashboard, Projects, Tasks, Kanban, Team, Analytics, Settings)
│
└── server/ (Express & Prisma)
    ├── src/config/         # Environment variables & schema definitions
    ├── src/middleware/     # JWT Auth, RBAC guards, Zod validators, Rate limiters
    ├── src/controllers/    # Business logic & Prisma database transactions
    ├── src/routes/         # Express REST routing endpoints
    ├── src/validators/     # Zod request validation schemas
    ├── src/utils/          # Password hasher, token serializer, uniform API response
    └── tests/              # 7 Vitest integration test suites (269 tests)
```

### Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ ProjectMember : "belongs to"
    User ||--o{ Project : "leads"
    User ||--o{ Task : "assigned to"
    User ||--o{ Comment : "authors"
    User ||--o{ Activity : "triggers"
    Workspace ||--o{ Project : "contains"
    Project ||--o{ ProjectMember : "has"
    Project ||--o{ Task : "contains"
    Project ||--o{ Activity : "logs"
    Task ||--o{ Comment : "has"
    Task ||--o{ Activity : "logs"

    User {
        string id PK
        string email UK
        string name
        string passwordHash
        SystemRole role
        string jobTitle
        string department
        string avatarUrl
        string status
        string bio
    }

    Workspace {
        string id PK
        string name
        string slug UK
        string description
    }

    Project {
        string id PK
        string name
        string description
        string workspaceId FK
        string leadId FK
        ProjectStatus status
        TaskPriority priority
        string category
        dateTime dueDate
    }

    ProjectMember {
        string id PK
        string projectId FK
        string userId FK
        ProjectRole role
    }

    Task {
        string id PK
        string title
        string description
        string projectId FK
        string assigneeId FK
        string creatorId FK
        TaskStatus status
        TaskPriority priority
        dateTime dueDate
        string[] tags
    }

    Comment {
        string id PK
        string content
        string taskId FK
        string authorId FK
        dateTime createdAt
    }

    Activity {
        string id PK
        ActivityType type
        string action
        string projectId FK
        string taskId FK
        string actorId FK
        dateTime createdAt
    }
```

---

## 5. REST API Documentation

All API responses follow a uniform JSON payload format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-07T10:00:00.000Z"
  }
}
```

### Endpoints Catalog

| Module | Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/api/health` | Public | System status and database connectivity check |
| **Auth** | `POST` | `/api/auth/register` | Public | Register new account & set HttpOnly cookie |
| | `POST` | `/api/auth/login` | Public | Authenticate user & issue session token |
| | `GET` | `/api/auth/me` | Authenticated | Fetch current authenticated user context |
| | `POST` | `/api/auth/logout` | Authenticated | Invalidate HttpOnly session cookie |
| **Workspaces**| `GET` | `/api/workspaces` | Authenticated | List accessible workspaces for user |
| | `GET` | `/api/workspaces/:id/analytics` | Workspace Member / Admin | Aggregated workspace metrics & workload |
| **Projects** | `GET` | `/api/projects` | Authenticated | List projects (supports `workspaceId`, `status`) |
| | `POST` | `/api/projects` | Authenticated | Create a new project milestone |
| | `GET` | `/api/projects/:id` | Project Viewer | Retrieve detailed project metadata |
| | `PUT` | `/api/projects/:id` | Project Maintainer | Update project details, status, or dates |
| | `DELETE`| `/api/projects/:id` | Project Lead / Admin | Delete project and cascade associated records |
| | `POST` | `/api/projects/:id/members` | Project Maintainer | Add a team member with role |
| | `GET` | `/api/projects/:id/activities`| Project Viewer | Reverse-chronological project activity feed |
| | `GET` | `/api/projects/:id/analytics` | Project Viewer | Status breakdown, overdue count, 7-day trend |
| **Tasks** | `GET` | `/api/tasks` | Authenticated | Filter tasks by project, assignee, status, priority |
| | `POST` | `/api/tasks` | Project Contributor | Create a work ticket in project |
| | `GET` | `/api/tasks/:id` | Project Viewer | Retrieve task details |
| | `PUT` | `/api/tasks/:id` | Project Contributor | Update title, description, due date, priority |
| | `PATCH`| `/api/tasks/:id/status` | Project Contributor | Update task status (`TODO` to `DONE`) |
| | `PATCH`| `/api/tasks/:id/assignee` | Project Maintainer | Reassign task owner |
| | `DELETE`| `/api/tasks/:id` | Task Creator / Maintainer | Delete a work ticket |
| | `GET` | `/api/tasks/:id/activities` | Project Viewer | Audit events scoped strictly to work ticket |
| **Comments** | `GET` | `/api/tasks/:taskId/comments` | Project Viewer | List comments on work item |
| | `POST` | `/api/tasks/:taskId/comments` | Project Contributor | Post a new comment |
| | `PUT` | `/api/comments/:id` | Comment Author | Edit comment content |
| | `DELETE`| `/api/comments/:id` | Author / Admin | Remove comment |
| **Users** | `GET` | `/api/users` | Authenticated | Directory of team members with stats |
| | `GET` | `/api/users/profile` | Authenticated | Current user profile |
| | `PUT` | `/api/users/profile` | Authenticated | Update user name, title, department, bio |

---

## 6. Role-Based Access Control (RBAC) Matrix

| Action | Admin | Project Lead | Maintainer | Contributor | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Project & Feeds** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Task** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Update Task Status** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Comment on Task** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Update Task Details** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Reassign Task** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Add Project Member** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Update Project Info** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Promote to Lead** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete Project** | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 7. Local Installation & Setup

### Prerequisites
- Node.js 20.x or 22.x
- npm 10.x or higher
- PostgreSQL database (or free [Neon Serverless PostgreSQL](https://neon.tech/))

### 1. Clone the Repository

```bash
git clone https://github.com/Kushalds03/Teamflow-project-management.git
cd Teamflow-project-management
```

### 2. Configure Backend Environment

```bash
cd server
cp .env.example .env
```

Populate `server/.env` with your values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://username:password@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=30"
JWT_SECRET=super_secret_jwt_passphrase_minimum_32_characters_long!
JWT_EXPIRES_IN=7d
COOKIE_NAME=teamflow_token
BCRYPT_ROUNDS=10
DEV_SEED_PASSWORD=DevPassword123!
```

### 3. Install Dependencies & Seed Database

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 4. Configure & Start Frontend

```bash
cd ../client
npm install
npm run dev
```

The frontend will run at `http://localhost:5173/`.
Start the backend server in a separate terminal:

```bash
cd server
npm run dev
```

The API will listen at `http://localhost:5000/`.

---

## 8. Pre-Configured Demo Accounts

For instant grading, testing, or review, TeamFlow includes one-click demo login buttons:

| Name | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Morgan** | `alex.morgan@teamflow.io` | `DevPassword123!` | System Admin / Lead | Full administrative cross-workspace access |
| **Sarah Chen** | `sarah.chen@teamflow.io` | `DevPassword123!` | Staff Frontend Engineer | Project member and contributor |
| **David Miller** | `david.miller@teamflow.io` | `DevPassword123!` | Senior Backend Engineer | Project maintainer and contributor |

---

## 9. Testing & Quality Verification

Run the entire backend integration test suite against live PostgreSQL:

```bash
cd server
npm test
```

### Test Suite Results: 269 / 269 Passed (100%)

- `tests/auth.test.ts` — 14 / 14 passed
- `tests/rbac.test.ts` — 18 / 18 passed
- `tests/project.test.ts` — 58 / 58 passed
- `tests/task.test.ts` — 80 / 80 passed
- `tests/comment.test.ts` — 39 / 39 passed
- `tests/activity.test.ts` — 31 / 31 passed
- `tests/analytics.test.ts` — 29 / 29 passed

### Production Builds

```bash
# Verify client compilation and bundle splitting
cd client
npm run build

# Verify server TypeScript compilation
cd ../server
npm run build
```

---

## 10. Production Deployment

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `client`.
3. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-api.onrender.com/api`
4. Deploy! SPA rewrites are automatically handled by `client/vercel.json`.

### Backend (Render / Node.js)
1. Create a New Web Service on [Render](https://render.com).
2. Set Root Directory to `server` (or use `render.yaml`).
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `npm start`
5. Configure Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = Your Neon PostgreSQL pooled connection string
   - `CLIENT_URL` = Your deployed Vercel frontend URL
   - `JWT_SECRET` = A strong 32+ character random string

---

## 11. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
