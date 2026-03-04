# ✂️ Trimly Ecosystem

[![MERN](https://img.shields.io/badge/Stack-MERN-3C873A?style=for-the-badge)](https://www.mongodb.com/mern-stack)
[![User App](https://img.shields.io/badge/App-User_Web-111827?style=for-the-badge&logo=react)](./user/README.md)
[![Provider App](https://img.shields.io/badge/App-Provider_Portal-1F2937?style=for-the-badge&logo=react)](./provider/README.md)
[![Admin Panel](https://img.shields.io/badge/App-Admin_Dashboard-0F172A?style=for-the-badge&logo=react)](./admin/README.md)
[![Backend](https://img.shields.io/badge/API-Render_Service-0466C8?style=for-the-badge&logo=render)](./backend/README.md)

> Trimly is a full multi-role salon booking platform with separate experiences for customers, service providers, and administrators.

---

## 📌 Project Overview

Trimly contains four deployable parts:

| Module | Path | Purpose |
|---|---|---|
| User App | [`user/`](./user/README.md) | Customer-facing salon discovery, booking, checkout flow, and profile tracking |
| Provider App | [`provider/`](./provider/README.md) | Service professional dashboard for bookings, availability, services, and earnings |
| Admin Panel | [`admin/`](./admin/README.md) | Platform operations dashboard for users, providers, services, analytics, and payments |
| Backend API | [`backend/`](./backend/README.md) | Node.js + Express + MongoDB API with JWT auth and Socket.io realtime events |

---

## 🧩 Architecture Overview (MERN)

```text
User App (React + Vite)        Provider App (React + Vite)        Admin Panel (React + Vite)
          \                               |                                  /
           \                              |                                 /
            ------------------ REST + Socket.io ----------------------------
                                      |
                             Backend (Node.js + Express)
                                      |
                               MongoDB (Mongoose)
```

### Core Design

- Single backend serving role-specific APIs.
- JWT authentication for all protected routes.
- Role + ownership checks in backend middleware.
- Socket.io for booking lifecycle updates and live provider state.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs, express-validator |
| Realtime | Socket.io (server + client) |
| Database | MongoDB Atlas |
| Deployment | Vercel (frontends), Render (backend) |

---

## 📁 Monorepo Structure

```text
Trimly/
├── admin/       # Admin dashboard frontend
├── provider/    # Provider dashboard frontend
├── user/        # Customer booking frontend
├── backend/     # API + DB + realtime server
├── shared/      # Shared assets/utilities (if used)
└── render.yaml  # Render deployment blueprint for backend
```

---

## 🚀 Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Trimly
```

Install dependencies for each module:

```bash
cd backend && npm install
cd ../user && npm install
cd ../provider && npm install
cd ../admin && npm install
```

### 2. Configure environment variables

Create `.env` files from examples:

```bash
cp backend/.env.example backend/.env
cp user/.env.example user/.env
cp provider/.env.example provider/.env
cp admin/.env.example admin/.env
```

### 3. Start backend first

```bash
cd backend
npm run dev
```

Backend default URL: `http://localhost:5000`

### 4. Start frontends

User app (default Vite port):

```bash
cd user
npm run dev
```

Provider app (recommended custom port):

```bash
cd provider
npm run dev -- --port 3001
```

Admin app (recommended custom port):

```bash
cd admin
npm run dev -- --port 3002
```

> `provider` and `admin` both define port `3000` in Vite config. Use custom CLI ports when running together.

---

## 🔐 Security & Auth Flow (JWT)

1. Client logs in via `/api/auth/login`.
2. Backend validates credentials and signs JWT.
3. Client stores token (`localStorage`) and attaches `Authorization: Bearer <token>` on requests.
4. Backend `protect` middleware verifies JWT + user status.
5. Role middleware (`onlyAdmin`, `onlyProvider`, `onlyCustomer`) guards route access.
6. On `401`, clients clear auth session and redirect to login.
7. Token refresh endpoints are available for admin/provider flow where implemented.

---

## ⚙️ Environment Variables (Quick Map)

| Module | Required Keys |
|---|---|
| backend | `MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URLS` |
| user | `VITE_BACKEND_URL` (or `VITE_API_BASE_URL`), `VITE_SOCKET_URL` |
| provider | `VITE_API_URL`, `VITE_API_BASE_URL`, `VITE_SOCKET_URL` |
| admin | `VITE_API_URL`, `VITE_API_BASE_URL` |

---

## ☁️ Deployment (Vercel + Render)

### Frontends on Vercel

Deploy each frontend as a separate Vercel project:

- `user/`
- `provider/`
- `admin/`

Recommended settings:

- Framework: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Add app-specific `VITE_*` environment variables in Vercel dashboard

### Backend on Render

Render blueprint is available in [`render.yaml`](./render.yaml):

- Service type: `web`
- Runtime: `node`
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

Set secret env vars in Render:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URLS` (comma-separated frontend domains)

---

## 🖼️ Screenshots (Placeholders)

Add images under `docs/screenshots/` and update links:

```md
![User Home](./docs/screenshots/user-home.png)
![Provider Dashboard](./docs/screenshots/provider-dashboard.png)
![Admin Dashboard](./docs/screenshots/admin-dashboard.png)
```

---

## 📚 App-Specific Documentation

- 👉 [User App README](./user/README.md)
- 👉 [Provider App README](./provider/README.md)
- 👉 [Admin Panel README](./admin/README.md)
- 👉 [Backend README](./backend/README.md)

---

## 🤝 Contribution Guidelines

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Keep commits focused and descriptive.
4. Test impacted modules before creating PR.
5. Open a Pull Request with:
   - clear problem statement
   - implementation notes
   - screenshots (for UI changes)
   - any environment/deployment impact

### Suggested standards

- Use consistent naming and folder patterns.
- Avoid hardcoded secrets/URLs.
- Reuse shared helpers/components where possible.
- Keep API contracts backward-compatible.

---

## 🌱 Future Roadmap

- Centralized design system package for all frontends.
- Shared auth SDK across apps.
- CI pipeline for lint/test/build per module.
- E2E smoke tests for booking lifecycle.
- Observability dashboards for API and socket events.

---

### **Designed & Developed by Ramlal Kumawat**

[![Instagram](https://img.shields.io/badge/Instagram-@_ramlal__kumawat-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/_ramlal__kumawat/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ramlal_Kumawat-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ramlal-kumawat-b5a3161a0)
[![Email](https://img.shields.io/badge/Email-ramlalkumawat2001%40gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:ramlalkumawat2001@gmail.com)
