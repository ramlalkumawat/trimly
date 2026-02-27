# Project Code Map — Trimly Frontend

This document explains the purpose of each folder/file and describes key code areas and what important lines do. Use this as a quick developer guide and reference for the UI-only frontend.

**Project root**
- `package.json`: npm manifest. Key properties:
  - `dependencies`/`devDependencies`: packages used (React, Vite, Tailwind). Scripts: `dev`, `build`, `preview`.
- `index.html`: root HTML. Contains `<div id="root"></div>` where React mounts and the module script to `src/main.jsx`.
- `tailwind.config.js`: Tailwind configuration extending palette and adding custom radii/shadows. Defines `primary` (#ffcc00) and `input-bg` (#f7f7f7).
- `postcss.config.js`: loads `tailwindcss` and `autoprefixer` for CSS processing.

**/src** — React application source
- `main.jsx`:
  - Imports `createRoot` from `react-dom/client` and `BrowserRouter` from `react-router-dom`.
  - `createRoot(document.getElementById('root')).render(...)` mounts the app. That single line bootstraps React into the `index.html` div.
- `index.css`:
  - Loads Tailwind layers with `@tailwind base`, `@tailwind components`, `@tailwind utilities`.
  - Declares CSS variables mapping to required color palette (`--primary`, `--input-bg`, etc.).
  - Adds utility helper classes: `.btn-primary`, `.input-default` used across components.

**`src/App.jsx`**
- Purpose: top-level app shell and route definitions.
- Key parts:
  - Imports React Router's `Routes` and `Route` and defines routes:
    - `/` → `Landing`
    - `/login` → `Login`
    - `/services` → `Services`
    - `/services/:id` → `ServiceDetail`
    - `/slots/:id` → `Slots`
    - `/checkout` → `Checkout`
    - `/success` → `Success`
    - `/profile` → `Profile`
  - The `<Navbar />` is placed above `<Routes>` so it appears on every page.

**`src/data/services.js`**
- Purpose: dummy dataset used by pages. Exports an array of service objects with `id`, `name`, `price`, `duration`, `description`, `includes`.
- How it's used: `Services.jsx` maps this array to `ServiceCard` components; `ServiceDetail.jsx` finds an item by `id` using `Array.find`.

--- Components (reusable UI pieces) ---

**`src/components/Navbar.jsx`**
- Purpose: simple navigation bar.
- Key lines:
  - `useNavigate()` hook from React Router used for programmatic navigation (button clicks call `nav('/login')`).
  - Left: brand box (`T`) with rounded `rounded-2xl` styling.
  - Right: `Login` button uses `bg-primary` (Tailwind CSS variable) to match CTA color.

**`src/components/ServiceCard.jsx`**
- Purpose: displays a service summary card with name, description, duration, price and a `Book Now` link.
- Key lines:
  - `<Link to={`/services/${service.id}`}>`: navigates to the service detail page for that service.
  - Price & duration are displayed plainly; card uses `rounded-2xl` and `shadow-soft` for the polished look.

**`src/components/SlotButton.jsx`**
- Purpose: small button representing a time slot.
- Key lines:
  - `selected` prop toggles classes so when `selected` is true the button gets `bg-primary text-black` (highlight color).
  - `onClick` prop sets the selected slot in parent page (`Slots.jsx`).

**`src/components/Input.jsx`**
- Purpose: tiny wrapper around `<input>` to keep consistent `input-default` styling across the app.
- Key lines:
  - `...props` spreads attributes so it can be used for `value`, `onChange`, `placeholder`, or `className`.

--- Pages ---

General: All pages are functional components using React hooks (`useState`, `useNavigate`, `useParams`) and Tailwind classes for layout/styling. There is no backend logic — navigation and state are client-side only.

**`src/pages/Landing.jsx`**
- Purpose: centered hero landing page with headline, location input, and primary CTA.
- Key lines and what they do:
  - `const [loc, setLoc] = useState('')`: controlled input state for the location field.
  - `const nav = useNavigate()`: used to navigate to `/services` when the CTA is clicked.
  - `<Input value={loc} onChange={(e)=>setLoc(e.target.value)} />`: controlled input keeps `loc` in sync.
  - `<button onClick={()=>nav('/services')} className="btn-primary">Find Services</button>`: primary CTA driving navigation.

**`src/pages/Login.jsx`**
- Purpose: phone-number OTP style UI (UI-only).
- Key lines:
  - `const [otpSent, setOtpSent] = useState(false)`: toggles between phone input and OTP input UI.
  - When `Send OTP` clicked: `setOtpSent(true)` shows the OTP entry inputs.
  - OTP inputs are single-character `<input>`s; they update an `otp` array state with `slice(0,1)` to constrain characters.
  - `Verify & Continue` navigates to `/profile` (no auth validation).

**`src/pages/Services.jsx`**
- Purpose: lists available services in a responsive grid.
- Key lines:
  - `services.map(s => <ServiceCard key={s.id} service={s} />)`: renders a card per service.

**`src/pages/ServiceDetail.jsx`**
- Purpose: shows full service info and `Select Slot` button.
- Key lines:
  - `const { id } = useParams()`: grabs `:id` from the route.
  - `const service = services.find(s=>s.id===id)`: finds service object by id.
  - `onClick` of `Select Slot` uses `useNavigate()` to go to `/slots/${service.id}`.

**`src/pages/Slots.jsx`**
- Purpose: pick a date and time slot for a selected service.
- Key lines:
  - `const [date, setDate] = useState(new Date().toISOString().slice(0,10))`: defaults to today's date in YYYY-MM-DD for the `<input type="date">`.
  - `const [selected, setSelected] = useState(null)`: holds the selected time string.
  - `SlotButton` receives `selected===t` to highlight the chosen slot.
  - `Continue` button is disabled until `selected` is set; it navigates to `/checkout`.

**`src/pages/Checkout.jsx`**
- Purpose: booking summary, editable address, and payment method selection.
- Key lines:
  - `const [address, setAddress] = useState('123 Main St')`: editable address field bound to the `Input` component.
  - Payment method uses simple radio inputs updating `method` state.
  - Booking summary shows `price`, `tax`, and `total` from a local `summary` object.
  - `Book Now` navigates to `/success` (UI-only confirmation flow).

**`src/pages/Success.jsx`**
- Purpose: final confirmation screen with a generated booking ID, assigned professional and ETA.
- Key lines:
  - `const bookingId = 'BK' + Math.random().toString(36).slice(2,8).toUpperCase()`: creates a short pseudo-random booking reference.
  - `Go to Profile` button navigates to `/profile`.

**`src/pages/Profile.jsx`**
- Purpose: shows mock user profile, saved address, booking history, and a `Logout` button (navigates home).
- Key lines:
  - `bookings` array at top: static booking history used for the list.
  - Logout button calls `nav('/')`.

--- Styling & conventions ---
- Spacing, rounded corners and shadows use the extended Tailwind tokens in `tailwind.config.js`: `rounded-2xl`, `shadow-soft` to meet the design requirements.
- Color tokens are applied via CSS variables in `src/index.css` so components can consistently use `var(--primary)` through helper classes like `.btn-primary`.
- All navigation uses `react-router-dom` hooks: `useNavigate` (programmatic) and `Link` (declarative).
- Local state uses `useState` only — no Redux / global store.

If you want, I can:
- Add inline code comments inside specific files (I avoided editing the source files themselves to keep them clean); or
- Insert JSDoc comments for components and functions; or
- Generate a simplified code walkthrough video script.

Let me know which files you want line-by-line inline comments added to and I will apply them.
