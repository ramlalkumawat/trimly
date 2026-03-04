# 👨‍🔧 Trimly Provider App

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT-111827?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Project Overview

Trimly Provider App is the professional dashboard for service providers. It supports booking actions, service management, availability updates, profile management, and earnings insights with real-time updates.

---

## ✨ Features

- Provider login and protected routes.
- Live dashboard stats.
- Booking queue management.
- Accept / reject / start / complete service flow.
- Claim available bookings.
- Online/offline availability toggle.
- Service CRUD for provider catalog.
- Earnings view with date filters.
- Realtime updates using Socket.io.

---

## 🧰 Tech Stack

| Category | Tools |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| API Client | Axios |
| Realtime | Socket.io Client |
| Charts | Recharts |
| Date Utilities | date-fns |
| Icons | Heroicons, Lucide React |
| Auth State | React Context + Reducer |

---

## 📁 Folder Structure

```text
provider/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js
│   │   └── provider.js
│   ├── components/
│   │   └── common/
│   ├── constants/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useSocket.js
│   │   └── useToast.js
│   ├── pages/
│   ├── routes/
│   │   └── ProviderPrivateRoute.jsx
│   ├── utils/
│   │   └── socket.js
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
cd provider
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

If running with other frontends, use a custom port:

```bash
npm run dev -- --port 3001
```

### 5. Production build

```bash
npm run build
npm run preview
```

---

## 🔐 Environment Variables

Create `.env` in `provider/`:

```env
VITE_API_URL=https://trimly-1q56.onrender.com
VITE_API_BASE_URL=https://trimly-1q56.onrender.com
VITE_SOCKET_URL=https://trimly-1q56.onrender.com
VITE_NODE_ENV=development
```

---

## 🔌 API Configuration

### Axios setup

File: `src/api/axios.js`

Base URL priority:

1. `VITE_API_URL`
2. `VITE_API_BASE_URL`
3. `REACT_APP_API_URL`
4. fallback: `https://trimly-1q56.onrender.com`

### Provider API modules

File: `src/api/provider.js`

- Auth: `/auth/login`, `/auth/logout`, `/auth/refresh`
- Dashboard: `/provider/dashboard`
- Bookings: `/provider/bookings/*`, `/provider/available-bookings`
- Services: `/provider/services/*`
- Profile: `/provider/profile`
- Availability: `/provider/availability`
- Earnings: `/provider/earnings`

### Realtime socket

File: `src/utils/socket.js`

Listens to events like:

- `new_booking`
- `new_booking_request`
- `booking_status_updated`
- `booking_updated`
- `booking_cancelled`
- `booking_rejected`

---

## ☁️ Deployment (Vercel + Render)

### Frontend (Vercel)

- Root directory: `provider`
- Build command: `npm run build`
- Output directory: `dist`
- Add env vars: `VITE_API_URL`, `VITE_API_BASE_URL`, `VITE_SOCKET_URL`
- `vercel.json` includes SPA rewrite fallback

### Backend (Render)

Provider app depends on backend service deployed via root [`render.yaml`](../render.yaml).

Ensure Render `CLIENT_URLS` includes provider domain for CORS + Socket.io.

---

## 🖼️ Screenshots (Placeholders)

```md
![Provider Dashboard](./docs/screenshots/provider-dashboard.png)
![Provider Bookings](./docs/screenshots/provider-bookings.png)
![Provider Services](./docs/screenshots/provider-services.png)
![Provider Earnings](./docs/screenshots/provider-earnings.png)
```

---

## 🧭 Usage Instructions

1. Login with provider credentials.
2. Open dashboard for live summary.
3. Manage bookings from bookings page.
4. Maintain service catalog from services page.
5. Toggle availability according to work status.
6. Monitor income in earnings section.
7. Update profile details.

---

## 🔒 Security / Auth Flow (JWT)

1. Provider logs in using `/api/auth/login`.
2. Token is stored in `localStorage` as `providerToken`.
3. Axios interceptor attaches JWT on each request.
4. Backend validates token + role + approval status.
5. Unauthorized responses trigger logout and redirect to `/login`.
6. Socket connection is authenticated using same JWT.
7. Logout clears token and disconnects socket.

---

## 🌱 Future Improvements

- Push notification support for booking events.
- Calendar sync integrations.
- Service slot capacity management.
- Earnings export and tax report support.
- Improved offline/reconnect handling for sockets.

---

### **Designed & Developed by Ramlal Kumawat**

[![Instagram](https://img.shields.io/badge/Instagram-@_ramlal__kumawat-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/_ramlal__kumawat/)
[![Trimly Ecosystem](https://img.shields.io/badge/Back_to-Trimly_Root-111827?style=for-the-badge&logo=github&logoColor=white)](../README.md)
