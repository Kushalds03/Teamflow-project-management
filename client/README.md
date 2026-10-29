# TeamFlow — Enterprise Project Management & Collaboration Platform

**TeamFlow** is a modern, high-performance SaaS project management platform built for engineering teams, sprint leads, and technical product managers. It combines modern light SaaS aesthetics with enterprise dashboard data density, responsive workflows, and real-time state manipulation.

---

## 🌟 Phase 1 Feature Overview

### 1. Unified Application Shell & Navigation
- **Deep Navy Sidebar (`#111827`)**: Fixed/collapsible responsive navigation with workspace switcher, live task count indicators, active navigation highlighting (`#4F46E5`), and user profile status.
- **Top Navigation Bar**: Live breadcrumb navigation, global search, notification center with unread counters, and quick-create action buttons.
- **Toast Feedback System**: Real-time optimistic UI notifications for task status updates, project creation, and preference saves.

### 2. Main Dashboard
- **Welcome & Sprint Context**: Personalized greeting (`Alex Morgan`), live formatted date indicator, and primary action triggers.
- **4 Reactive Metric Cards**:
  1. *Total Projects* (Active project initiatives)
  2. *Tasks In Progress* (Current active sprint load)
  3. *Completed Tasks* (Sprint velocity milestone indicator)
  4. *Overdue Tasks* (SLA risk & blocker indicator)
- **Interactive Recharts Visualizations**:
  - *Task Distribution by Status* (Custom donut chart with status color tokens)
  - *Weekly Task Velocity* (Bar chart comparing planned vs completed story points)
- **Project Progress Tracker**: Milestone list with animated progress bars, target due dates, member avatar stacks, and task completion metrics.
- **Task Overview Table**: Real-time status switcher dropdown, quick checkbox to complete tasks, priority badges, and assignee information.
- **Live Activity Feed**: Real-time audit events for task completions, project creations, and member assignments.

### 3. Dedicated Functional Pages
- **Projects (`/projects`)**:
  - Grid View and Table View toggle.
  - Category filters (*Frontend & UX*, *Mobile*, *Backend & Security*, *Analytics*, *DevOps*, *Design System*).
  - Search bar and status filters.
  - Project deletion confirmation modal for safe state manipulation.
- **My Tasks (`/my-tasks`)**:
  - Filter toggle between *Assigned to Me* and *All Team Tasks*.
  - Inline status dropdown updates that automatically recalculate project completion percentages.
  - Instant checkbox completion with toast feedback.
  - Filter by project, priority, and status.
- **Kanban Board (`/kanban`)**:
  - 4 Sprint columns: *To Do*, *In Progress*, *In Review*, and *Done*.
  - Drag-and-drop ticket movement across columns.
  - One-click adjacent column transfer buttons (left/right arrows).
  - Column "+ Quick Add" action.
  - Project filter dropdown.
- **Team Members (`/team`)**:
  - Directory cards with user avatar, online status indicator, email, and engineering role.
  - Workload metrics: assigned projects count and open task count.
  - Search and department filter (*Engineering*, *Design*, *Infrastructure*, *DevOps*, *Product*).
  - "Invite Member" modal dialog.
- **Analytics & Reports (`/analytics`)**:
  - High-level KPIs: *Completion Rate*, *Active Workload*, *Overdue Count*, *Team Capacity*.
  - 4 Recharts charts: *Project Pacing*, *Task Status Distribution*, *Team Workload Allocation*, and *Sprint Burnup Velocity*.
- **Settings (`/settings`)**:
  - Profile preferences (name, email, role, department, bio).
  - Notification toggles (email, push, weekly digest, task alerts).
  - Appearance settings (Light SaaS preset, compact mode).
  - Local browser storage persistence.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Typography**: [Inter](https://fonts.google.com/specimen/Inter)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualizations**: [Recharts](https://recharts.org/)
- **Routing**: [React Router v7](https://reactrouter.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### Installation & Local Development

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the Vite development server:
```bash
npm run dev
```
Open your browser at [http://127.0.0.1:5173](http://127.0.0.1:5173).

4. Build for production:
```bash
npm run build
```
This runs `tsc -b` and `vite build`, generating optimized static assets in the `dist/` directory.

---

## 📁 Architecture & File Structure

```
client/
├── public/
│   ├── favicon.svg             # TeamFlow branded SVG icon
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard widgets (Welcome, Metrics, Charts, Tables, Activity)
│   │   ├── layout/             # AppLayout, Sidebar, Navbar
│   │   ├── projects/           # CreateProjectModal, filters
│   │   ├── tasks/              # CreateTaskModal, filters
│   │   └── ui/                 # Reusable Badge, Button, Card, Avatar, Modal, ProgressBar, Toast
│   ├── context/
│   │   └── AppContext.tsx      # Unified state store with localStorage sync & optimistic actions
│   ├── data/
│   │   └── mockData.ts         # High-fidelity realistic enterprise seed data
│   ├── pages/
│   │   ├── DashboardPage.tsx   # Core executive dashboard
│   │   ├── ProjectsPage.tsx    # Project roadmap & milestones
│   │   ├── MyTasksPage.tsx     # Sprint task list & filters
│   │   ├── KanbanPage.tsx      # Drag-and-drop kanban board
│   │   ├── TeamPage.tsx        # Engineering member directory
│   │   ├── AnalyticsPage.tsx   # Recharts reporting suite
│   │   └── SettingsPage.tsx    # User and workspace preferences
│   ├── types/
│   │   └── index.ts            # Strict TypeScript models & interfaces
│   ├── App.tsx                 # Router definition & provider root
│   ├── index.css               # Tailwind CSS v4 setup & custom scrollbars
│   └── main.tsx                # React DOM entry point
├── package.json
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```
