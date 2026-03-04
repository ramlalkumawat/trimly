# 🛡️ Trimly Admin Panel

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT-111827?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Project Overview

Trimly Admin Panel is the operations dashboard for managing the entire platform. It provides admin-only access to users, providers, services, bookings, commissions, payments, analytics, and profile settings.

---

## ✨ Features

- Dashboard overview with operational metrics.
- User management with status controls.
- Provider management and verification workflow.
- Service catalog management.
- Booking lifecycle monitoring.
- Payments and refund actions.
- Commission management.
- Analytics visualizations.
- Admin profile and settings management.
- Single sidebar logout with session cleanup.

---

## 🧰 Tech Stack

| Category | Tools |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| API Client | Axios (with interceptors) |
| Charts | Recharts |
| Icons | Heroicons |
| State/Auth | React Context (`AuthContext`) |

---

## 📁 Folder Structure

```text
admin/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js
│   ├── components/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   │   └── admin/
│   ├── routes/
│   │   └── AdminPrivateRoute.jsx
│   ├── utils/
│   │   ├── api.js
│   │   └── auth.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── vercel.json
└── package.json
```

---

## 🚀 Installation Guide

### 1. Move to app directory

```bash
cd admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment

```bash
cp .env.example .env
```

### 4. Run development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
npm run preview
```

---

## 🔐 Environment Variables

Create `.env` in `admin/`:

```env
VITE_API_URL=https://trimly-1q56.onrender.com
VITE_API_BASE_URL=https://trimly-1q56.onrender.com
VITE_NODE_ENV=development
```

Optional keys from `.env.example`:

```env
# VITE_STRIPE_PUBLIC_KEY=pk_test_...
# VITE_GOOGLE_MAPS_API_KEY=...
# VITE_SENTRY_DSN=...
```

---

## 🔌 API Configuration

Primary API client: `src/api/axios.js`

### Base URL resolution

1. `VITE_API_URL`
2. `VITE_API_BASE_URL`
3. `REACT_APP_API_URL`
4. fallback: `https://trimly-1q56.onrender.com`

`/api` is auto-appended when needed.

### Admin API modules

Defined in `src/utils/api.js`:

- `adminAPI.auth.*`
- `adminAPI.users.*`
- `adminAPI.providers.*`
- `adminAPI.services.*`
- `adminAPI.bookings.*`
- `adminAPI.payments.*`
- `adminAPI.commissions.*`
- `adminAPI.analytics.*`
- `adminAPI.profile.*`

---

## ☁️ Deployment (Vercel + Render)

### Frontend (Vercel)

- Root directory: `admin`
- Build command: `npm run build`
- Output directory: `dist`
- Include `VITE_API_URL` / `VITE_API_BASE_URL`
- `vercel.json` already includes SPA route fallback to `index.html`

### Backend (Render)

Admin panel consumes the backend deployed from root [`render.yaml`](../render.yaml).

Ensure Render service has:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URLS` (include your admin Vercel domain)

---

## 🖼️ Screenshots (Placeholders)

```md
![Admin Dashboard](./docs/screenshots/admin-dashboard.png)
![Admin Users](./docs/screenshots/admin-users.png)
![Admin Providers](./docs/screenshots/admin-providers.png)
![Admin Analytics](./docs/screenshots/admin-analytics.png)
```

---

## 🧭 Usage Instructions

1. Open admin app URL.
2. Login using an account with `role: admin`.
3. Navigate modules from sidebar:
   - Dashboard
   - Users
   - Providers
   - Services
   - Bookings
   - Payments
   - Commissions
   - Analytics
   - Settings
   - Profile
4. Use sidebar `Logout` to end session safely.

---

## 🔒 Security / Auth Flow (JWT)

1. Login via `POST /api/auth/login`.
2. Token is stored in `localStorage`.
3. Axios request interceptor attaches `Bearer` token.
4. `AuthContext` enforces admin role check after login.
5. Token expiry is checked from JWT payload (`exp`).
6. Auto refresh runs periodically via `/api/auth/refresh`.
7. On `401`, session is cleared and app redirects to `/login`.
8. Logout clears auth keys from `localStorage` + `sessionStorage` and redirects.

---

## 🌱 Future Improvements

- Add role-based granular permissions (RBAC matrix).
- Add audit logs for critical admin actions.
- Add advanced export/reporting (CSV/PDF).
- Add unit/integration tests for admin flows.
- Add feature flags for staged rollout.

---

### **Designed & Developed by Ramlal Kumawat**

[![Instagram](https://img.shields.io/badge/Instagram-@_ramlal__kumawat-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/_ramlal__kumawat/)
[![Trimly Ecosystem](https://img.shields.io/badge/Back_to-Trimly_Root-111827?style=for-the-badge&logo=github&logoColor=white)](../README.md)
