# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Run both frontend and backend together
```bash
npm run start:all
```

### Run separately
```bash
npm run dev        # Frontend (Vite) → http://localhost:5173
npm run server     # Backend (Express) → http://localhost:5001
```

### Build & lint
```bash
npm run build      # TypeScript compile + Vite build → dist/
npm run lint       # ESLint
```

### Backend dev (with hot reload)
```bash
cd server && npm run dev   # nodemon
```

## Architecture

This is a **multi-tenant project management SaaS** called WorkPlan/FlowLive.

```
workflowLive/
├── src/                     # React 19 + TypeScript frontend
│   ├── App.tsx              # Route definitions + top-level providers
│   ├── types.ts             # Shared TypeScript interfaces
│   ├── components/
│   │   ├── Dashboard.tsx    # Main view host: Table, Kanban, Timeline, etc.
│   │   ├── Sidebar.tsx      # Navigation, notifications, theme, language switcher
│   │   ├── ProjectForm.tsx  # Dynamic project creation form
│   │   └── views/
│   │       ├── CockpitView.tsx        # Superadmin: manage all departments
│   │       └── DepartmentSettings.tsx # Admin: configure dept products/types/form/members
│   ├── context/
│   │   ├── AuthContext.tsx       # JWT stored in localStorage; exposes user, token, login/logout
│   │   ├── NavigationProvider.tsx# ViewType state + URL sync (pushState, no React Router for views)
│   │   └── ThemeContext.tsx      # light/dark theme
│   ├── services/socket.ts        # Single socket.io-client instance (VITE_API_URL)
│   └── i18n/locales/            # en.json, fr.json, ar.json
│
└── server/
    ├── index.js            # Monolithic Express + Socket.io server
    ├── models/User.js      # Mongoose User model (used only when USE_LOCAL_DB=false)
    └── data/               # JSON flat-file DB (used when USE_LOCAL_DB=true)
        ├── users.json
        ├── departments.json
        ├── projects.json
        ├── notifications.json
        └── invitations.json
```

### Dual database mode

The server has two modes controlled by `server/.env`:
- **`USE_LOCAL_DB=true`** (default for development): reads/writes JSON files in `server/data/`. No MongoDB needed.
- **`USE_LOCAL_DB=false`**: uses MongoDB Atlas via `MONGODB_URI`. Requires a running cluster.

### Role-based access

Four roles enforced both server-side (JWT claims) and in the frontend:

| Role identifier | Access |
|----------------|--------|
| `superadmin` | Cockpit view (`/cockpit`): create/edit/delete departments, select which dept to view |
| `chef de projet` | Department Cockpit (`/department-cockpit`): configure products, types, form fields, invite members |
| `chef de produit` | Can create new projects (sees "New" button) |
| `worker` | Can only update their assigned projects' status |

### View routing

Navigation does **not** use React Router for view switching. `NavigationProvider` holds a `ViewType` enum state and syncs it with `window.history.pushState`. Views are rendered by conditional checks in `Dashboard.tsx` and `App.tsx`. Only `/cockpit` and `/department-cockpit` paths are handled specially.

### Real-time updates (Socket.io)

The single `socket` instance in `src/services/socket.ts` connects to `VITE_API_URL`. Events:
- `new_project` (emit) → server saves and broadcasts `project_added`
- `update_project_status` (emit) → server updates and broadcasts `project_updated`
- `notification_added` (listen) → sidebar updates unread badge

### Department configuration

Each department stored in `departments.json` has:
- `products[]` / `types[]`: dropdown options for the project form
- `activePages[]`: controls which tabs appear in Dashboard
- `formFields[]`: configures columns in the Table view (draggable, typed)
- `pageConfigs`: per-view settings
- `coverUrl` / `logoUrl`: branding

The admin configures all of this via `DepartmentSettings` and it is fetched by `Dashboard` on load via `GET /api/departments/my-config`.

### Environment variables

**`server/.env`**
```
PORT=5001
MONGODB_URI=<atlas connection string>
JWT_SECRET=<secret>
USE_LOCAL_DB=true|false
EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS / EMAIL_FROM
FRONTEND_URL=http://localhost:5173
```

**Frontend** (optional `.env` at root):
```
VITE_API_URL=http://localhost:5001
```

The frontend defaults to `http://localhost:5001` if `VITE_API_URL` is not set.

### Invitation flow

1. Superadmin creates department → if admin email not in users.json, an invitation token is saved and email sent.
2. Admin invites members via bulk email list → tokens saved, emails sent.
3. Invitee clicks link → `/signup/:token` → `SignupPage` validates token via `GET /api/invitations/verify/:token` → completes via `POST /api/auth/complete-signup`.
4. Public self-signup exists at `/register` (`PublicSignup`) — creates a `worker` role user.