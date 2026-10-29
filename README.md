# TeamFlow — Enterprise Project Management & Collaboration Platform

TeamFlow is a full-stack project management and collaboration application designed for software engineering and full-stack development placements.

## Phase 1: Professional Project Management Dashboard

Phase 1 delivers a commercial-grade, responsive frontend dashboard built with modern React, TypeScript, Vite, Tailwind CSS, Lucide icons, and Recharts.

### Key Highlights
- **Architecture**: Modular component architecture with strict TypeScript typing, custom state store (`AppContext`) with `localStorage` persistence, and optimistic state updates.
- **Design System**: Enterprise dark navy sidebar (`#111827`) paired with a modern crisp SaaS light theme (`#F8FAFC`), rounded-xl cards with subtle borders (`#E2E8F0`), Inter typography, and color-coded status badges.
- **Pages**:
  - `Dashboard`: Personalized welcome, 4 reactive KPI cards, 2 Recharts analytics widgets, project progress tracking, task table, and live activity feed.
  - `Projects`: Grid & Table view toggle, category filters, progress indicators, and deletion confirmation modal.
  - `My Tasks`: Toggle between *Assigned to Me* and *All Team Tasks*, inline status switcher, instant checkbox completion, and project/priority filters.
  - `Kanban Board`: 4 sprint pipeline columns with drag-and-drop support, quick move controls, and quick task creation.
  - `Team Members`: Member directory cards with role, department, project allocation, and invite dialog.
  - `Analytics`: 4 interactive charts (project progress, task status distribution, team capacity, and sprint velocity).
  - `Settings`: User profile configuration, notification toggles, and appearance preferences.

### Running Locally

```bash
cd client
npm install
npm run dev
```

The application will run locally at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

To run a production build:
```bash
cd client
npm run build
```
