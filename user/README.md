# 💇 Trimly User App

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT-111827?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Project Overview

Trimly User App is the customer-facing experience where users can browse salon services, select slots, book appointments, track status updates, and manage their profile and booking history.

---

## ✨ Features

- Landing and service discovery pages.
- Service details and slot selection flow.
- Secure login/register for customer role.
- Checkout and booking confirmation flow.
- Protected customer routes.
- Profile management and booking history.
- Realtime booking status updates (Socket.io).
- Static informational pages (Company, Customers, Professionals, Follow).

---

## 🧰 Tech Stack

| Category | Tools |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| API Client | Axios |
| Realtime | Socket.io client (dynamic loader hook) |
| Icons | Lucide React |

---

## 📁 Folder Structure

```text
user/
├── public/
├── src/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   │   └── useSocket.js
│   ├── pages/
│   ├── services/
│   │   └── api.js
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
cd user
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

Create `.env` in `user/`:

```env
VITE_BACKEND_URL=https://your-backend-service.onrender.com
VITE_API_BASE_URL=https://your-backend-service.onrender.com
VITE_SOCKET_URL=https://your-backend-service.onrender.com
```

`VITE_BACKEND_URL` is the preferred key.

---

## 🔌 API Configuration

Primary file: `src/utils/api.js`

### Base URL priority

1. `VITE_BACKEND_URL`
2. `VITE_API_BASE_URL`
3. `VITE_API_URL`
4. local dev fallback: `http://localhost:5000`

`/api` suffix is normalized automatically.

### Main endpoint groups used

- Auth: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/logout`
- Services: `/services`, `/services/:id`
- Bookings: `/bookings`, `/bookings/:id`, `/bookings/:id/status`
- User profile: `/user/profile`

### Socket setup

`src/hooks/useSocket.js` connects using:

- `VITE_SOCKET_URL` first
- fallback to backend env URL

It subscribes to booking events like `booking_status_updated`, `booking_accepted`, `booking_rejected`, and `service_completed`.

---

## ☁️ Deployment (Vercel + Render)

### Frontend (Vercel)

- Root directory: `user`
- Build command: `npm run build`
- Output directory: `dist`
- Add env vars: `VITE_BACKEND_URL`, `VITE_SOCKET_URL`
- `vercel.json` provides SPA route fallback

### Backend (Render)

User app consumes backend deployed from root [`render.yaml`](../render.yaml).

Ensure backend CORS/socket config includes user app domain in `CLIENT_URLS`.

---

## 🖼️ Screenshots (Placeholders)

```md
![Landing Page](./docs/screenshots/user-landing.png)
![Services List](./docs/screenshots/user-services.png)
![Slot Selection](./docs/screenshots/user-slots.png)
![Profile & History](./docs/screenshots/user-profile.png)
```

---

## 🧭 Usage Instructions

1. Open the user app.
2. Register or login with customer account.
3. Browse services and open details.
4. Choose slot and continue checkout.
5. Confirm booking and track status in profile.
6. Manage account details from profile page.

---

## 🔒 Security / Auth Flow (JWT)

1. User logs in/registers via `/api/auth/*` endpoints.
2. JWT + role are stored in `localStorage`.
3. `ProtectedRoute` checks token and `role === user`.
4. Axios interceptor sends `Authorization` header.
5. Backend validates JWT and role for protected APIs.
6. On unauthorized/role mismatch, session is cleared and redirected to `/login`.

---

## 🌱 Future Improvements

- Add payment gateway integration for checkout.
- Add saved addresses and map-based service areas.
- Add booking reschedule flow.
- Add notification center for booking events.
- Add automated test coverage for booking journey.

---

### **Designed & Developed by Ramlal Kumawat**

[![Instagram](https://img.shields.io/badge/Instagram-@_ramlal__kumawat-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/_ramlal__kumawat/)
[![Trimly Ecosystem](https://img.shields.io/badge/Back_to-Trimly_Root-111827?style=for-the-badge&logo=github&logoColor=white)](../README.md)
