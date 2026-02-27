# Multi-Role Architecture Documentation

## Overview

The Trimly backend now supports a complete multi-role architecture with three distinct applications:
- **User App** (`/api/user/*`) - Customer-facing application
- **Provider App** (`/api/provider/*`) - Service provider application  
- **Admin Panel** (`/api/admin/*`) - Administrative application

All applications share a single backend with role-based access control and real-time Socket.io integration.

## User Roles & Permissions

### User Role (`user`)
- **Access**: Customer-specific routes only
- **Permissions**:
  - Create and manage own bookings
  - View own profile and booking history
  - Cancel own bookings
  - Update profile and addresses

### Provider Role (`provider`)
- **Access**: Provider-specific routes only (requires approval)
- **Permissions**:
  - View assigned bookings
  - Accept/reject booking requests
  - Start and complete services
  - Manage own services (CRUD)
  - Update availability status
  - View earnings dashboard

### Admin Role (`admin`)
- **Access**: All routes and admin-specific endpoints
- **Permissions**:
  - Manage all users (approve, block, delete)
  - Manage all bookings and services
  - View system analytics and revenue
  - Update commission rates
  - Override booking status changes

## Authentication & Authorization

### JWT Token Structure
```json
{
  "id": "user_id",
  "role": "user|provider|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Middleware Stack

1. **Authentication Middleware** (`authMiddleware.js`)
   - Validates JWT token
   - Checks user existence and status
   - Verifies account is not blocked
   - Ensures provider approval for provider routes

2. **Role Middleware** (`roleMiddleware.js`)
   - `authorizeRoles(...roles)` - Generic role checker
   - `onlyAdmin` - Admin-only access
   - `onlyProvider` - Provider-only access
   - `onlyCustomer` - Customer-only access

3. **Ownership Middleware** (`ownershipMiddleware.js`)
   - `checkBookingOwnership` - Validates booking access rights
   - `checkServiceOwnership` - Validates service ownership
   - `checkBookingStatus` - Validates booking status transitions
   - `checkProviderStatus` - Validates provider approval status

## API Route Structure

### Authentication Routes (`/api/auth/*`)
```
POST /api/auth/register    - Register new user (any role)
POST /api/auth/login       - User login
POST /api/auth/logout      - User logout
GET  /api/auth/me         - Get current user profile
```

### User Routes (`/api/user/*`) - Customer Only
```
GET  /api/user/profile     - Get user profile
PUT  /api/user/profile     - Update user profile
POST /api/user/addresses   - Add address
POST /api/user/location    - Update location
```

### Provider Routes (`/api/provider/*`) - Provider Only
```
GET  /api/provider/dashboard           - Provider dashboard stats
GET  /api/provider/bookings            - Get provider bookings
PUT  /api/provider/bookings/:id/accept - Accept booking
PUT  /api/provider/bookings/:id/reject - Reject booking
PUT  /api/provider/bookings/:id/start  - Start service
PUT  /api/provider/bookings/:id/complete - Complete service
PUT  /api/provider/availability        - Toggle online/offline
GET  /api/provider/services            - Get provider services
POST /api/provider/services            - Add service
PUT  /api/provider/services/:id        - Update service
DELETE /api/provider/services/:id      - Delete service
GET  /api/provider/profile             - Get provider profile
PUT  /api/provider/profile             - Update provider profile
```

### Admin Routes (`/api/admin/*`) - Admin Only
```
GET  /api/admin/dashboard              - Admin dashboard stats
GET  /api/admin/users                  - Get all users
GET  /api/admin/users/:id              - Get user by ID
PUT  /api/admin/users/:id              - Update user
PUT  /api/admin/users/:id/block        - Block/unblock user
DELETE /api/admin/users/:id            - Delete user
PUT  /api/admin/providers/:id/approve  - Approve provider
PUT  /api/admin/providers/:id/reject   - Reject provider
GET  /api/admin/bookings               - Get all bookings
GET  /api/admin/bookings/:id           - Get booking by ID
PUT  /api/admin/bookings/:id/status    - Update booking status
GET  /api/admin/services               - Get all services
POST /api/admin/services               - Create service
PUT  /api/admin/services/:id           - Update service
DELETE /api/admin/services/:id         - Delete service
GET  /api/admin/commission             - Get commission settings
PUT  /api/admin/providers/:id/commission - Update provider commission
```

### General Routes (`/api/bookings/*`, `/api/services/*`)
```
POST /api/bookings                     - Create booking (users only)
GET  /api/bookings                     - Get bookings (role-based)
GET  /api/bookings/:id                 - Get booking details
PATCH /api/bookings/:id/status         - Update booking status
GET  /api/services                     - Get public services
```

## Database Schema Updates

### User Model Enhancements
```javascript
{
  role: { type: String, enum: ['user', 'provider', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'rejected', 'suspended'], default: 'active' },
  approved: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  // ... existing fields
}
```

### Booking Model Features
```javascript
{
  customerId: ObjectId,
  providerId: ObjectId,
  serviceId: ObjectId,
  status: { enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'] },
  statusHistory: [{ status, changedBy, role, note, changedAt }],
  // ... existing fields
}
```

## Real-Time Socket.io Events

### Provider Events
- `new_booking` - New booking assigned to provider
- `booking_status_updated` - Booking status changed
- `booking_accepted` - Booking accepted by provider
- `booking_rejected` - Booking rejected by provider
- `service_started` - Service started
- `service_completed` - Service completed

### Customer Events
- `booking_created` - Booking created successfully
- `booking_accepted` - Booking accepted by provider
- `booking_rejected` - Booking rejected by provider
- `booking_status_updated` - Booking status changed
- `service_started` - Service started
- `service_completed` - Service completed

### Admin Events
- `booking_status_updated` - Any booking status change
- `provider_registered` - New provider registration
- `user_blocked` - User blocked/unblocked

## Security Features

### Access Control
- **JWT Authentication** - All protected routes require valid token
- **Role-Based Authorization** - Strict role checking on all endpoints
- **Ownership Validation** - Users can only access their own resources
- **Status Validation** - Booking status transitions are validated
- **Provider Approval** - Providers must be approved before accessing routes

### Data Protection
- **Password Hashing** - bcryptjs for secure password storage
- **Input Validation** - Mongoose schema validation
- **Error Handling** - Consistent error responses
- **Rate Limiting** - Can be added with express-rate-limit

## Testing

### Multi-Role Authentication Test
Run the comprehensive test suite:
```bash
cd backend
node test_multi_role_auth.js
```

This test verifies:
- User registration and login for all roles
- Role-based route access control
- Provider approval workflow
- Booking creation and ownership
- Real-time events
- User blocking functionality

## Deployment Considerations

### Environment Variables
```env
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
CLIENT_URLS=http://localhost:3000,http://localhost:5173
ADMIN_REGISTRATION_KEY=optional_admin_key
```

### Database Indexes
```javascript
// User indexes
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, approved: 1, verified: 1 });

// Booking indexes
bookingSchema.index({ providerId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ customerId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ status: 1, scheduledTime: 1 });
```

## Frontend Integration

### User App
- Base URL: `/api/user/*`
- Authentication: Store JWT token in localStorage/httpOnly cookies
- Socket.io: Connect with user token for real-time updates

### Provider App
- Base URL: `/api/provider/*`
- Authentication: Provider must be approved to access routes
- Socket.io: Listen for provider-specific events

### Admin Panel
- Base URL: `/api/admin/*`
- Authentication: Admin-only access
- Socket.io: Monitor system-wide events

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `400` - Bad Request (invalid input)
- `500` - Internal Server Error

## Future Enhancements

### Planned Features
- **Role-Based Rate Limiting** - Different limits per role
- **Permission System** - Granular permissions within roles
- **Audit Logging** - Track all admin actions
- **Multi-Tenant Support** - Separate business accounts
- **Webhook Integration** - External system notifications

### Scalability
- **Redis Caching** - Cache frequently accessed data
- **Database Sharding** - Split data by region/tenant
- **Load Balancing** - Multiple server instances
- **CDN Integration** - Static asset delivery
