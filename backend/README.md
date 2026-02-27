# Trimly Backend

This is the Node.js + Express backend for the Trimly salon booking marketplace. It uses MongoDB via Mongoose and is structured for clean modular development.

## Features
- Express server with CORS and JSON parsing
- MongoDB Atlas connection
- User authentication with hashed passwords and JWTs
- Role-based access control (customer/provider/admin)
- Booking model & CRUD operations
- Centralized error handling and async utility

## Setup

1. Copy `.env.example` to `.env` and fill in values:
   ```
   PORT=5000
   MONGO_URI=<your-mongo-uri>
   JWT_SECRET=<your-secret>
   ```
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Run in development:
   ```bash
   npm run dev   # nodemon will watch for changes
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` – register a new user
- `POST /api/auth/login` – login and receive JWT

### Bookings (protected)
- `POST /api/bookings` – create booking (customer)
- `GET /api/bookings` – list bookings (filtered by role)
- `PATCH /api/bookings/:id/status` – update status (provider/admin)

## Project Structure

```
backend/
  config/db.js        # Mongo connection
  controllers/        # request handlers
  middlewares/        # auth, roles, error handling
  models/             # mongoose schemas
  routes/             # express routers
  utils/              # helpers (async, errors)
  server.js           # entry point
```


