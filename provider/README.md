# Trimly Service Provider App

A comprehensive service provider management application for the Trimly platform, built with modern React technologies and featuring real-time booking management, service catalog control, and earnings tracking.

## 🚀 Tech Stack

- **React** (v18) + **Vite** for fast development
- **Tailwind CSS** for premium, modern styling with yellow accent
- **React Router DOM** for client-side routing
- **Axios** with interceptors for API communication
- **JWT Authentication** with role-based access control
- **Socket.io** for real-time booking updates
- **Recharts** for earnings analytics and data visualization
- **Heroicons** for consistent iconography
- **React Spinners** for loading states
- **date-fns** for date manipulation

## 📋 Features

### 🔐 Provider Authentication
- JWT-based authentication with automatic token refresh
- Role-based access control (provider-only)
- Protected routes with automatic redirect
- Token expiration handling and auto-logout
- Secure API communication with interceptors

### � Provider Dashboard
- Real-time booking statistics
- Today's bookings count and pending requests
- Completed services tracking
- Total earnings overview
- Online/Offline availability toggle
- Recent activity feed

### � Booking Management
- **Real-Time Booking Requests**: View user name, address, service details, date, time, and price
- **Accept/Reject Actions**: Instant booking status updates
- **Accepted Bookings**: Start Service and Mark as Completed buttons
- **Status Tracking**: Pending → Accepted → In Progress → Completed
- Real-time notifications via Socket.io

### 🛠️ Service Management
- Complete CRUD operations for services
- Service catalog with categories
- Pricing and duration management
- Service descriptions
- Active/inactive status control
- Category-based organization

### � Earnings Tracking
- Total income overview
- Date-wise filtering (7 days, 30 days, 3 months, custom range)
- Daily and monthly earnings charts
- Transaction history
- Average earnings calculations
- Revenue analytics with Recharts

### � Profile Management
- Personal information updates
- Profile image upload
- Service area configuration
- Business description
- Contact information management
- Account details view

### � Real-Time Features
- Socket.io integration for live updates
- New booking notifications
- Booking status updates
- Real-time availability status
- Instant provider-customer synchronization

## 🏗️ Architecture

### Folder Structure
```
src/
 ├── api/                # API integration layer
 │   └── provider.js     # Provider-specific API calls
 ├── components/
 │   └── common/         # Header, Sidebar, Toast components
 ├── context/
 │   └── AuthContext.jsx # Authentication state management
 ├── hooks/
 │   ├── useToast.js     # Toast notification hook
 │   └── useSocket.js    # Socket.io integration hook
 ├── pages/              # Main application pages
 │   ├── Dashboard.jsx   # Provider dashboard
 │   ├── Bookings.jsx    # Booking management
 │   ├── Services.jsx    # Service catalog
 │   ├── Earnings.jsx   # Earnings tracking
 │   ├── Profile.jsx     # Profile management
 │   └── Login.jsx       # Provider login
 ├── routes/
 │   └── ProviderPrivateRoute.jsx # Route protection
 ├── utils/
 │   └── socket.js       # Socket.io service
 ├── App.jsx             # Main app component
 ├── main.jsx            # Entry point
 └── index.css           # Tailwind styles
```

### API Integration
- Centralized API configuration in `src/api/provider.js`
- Automatic JWT token attachment
- Global error handling with 401 redirect
- Environment-based configuration
- Comprehensive provider endpoint coverage

### Security Features
- Provider-only access control
- JWT token validation and refresh
- Booking ownership validation
- Automatic logout on token expiration
- Secure API communication
- Input validation and sanitization

## 🚀 Quick Start

1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API configuration
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 🔧 Environment Variables

Create a `.env` file:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📡 API Endpoints

The provider app expects the following API structure:

### Authentication
- `POST /api/auth/login` - Provider login
- `POST /api/auth/logout` - Provider logout  
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current provider

### Provider Dashboard
- `GET /api/provider/dashboard` - Dashboard statistics

### Bookings
- `GET /api/provider/bookings` - List provider bookings
- `PUT /api/provider/bookings/:id/accept` - Accept booking
- `PUT /api/provider/bookings/:id/reject` - Reject booking
- `PUT /api/provider/bookings/:id/start` - Start service
- `PUT /api/provider/bookings/:id/complete` - Complete service

### Services
- `GET /api/provider/services` - List provider services
- `POST /api/provider/services` - Create service
- `PUT /api/provider/services/:id` - Update service
- `DELETE /api/provider/services/:id` - Delete service

### Profile & Availability
- `GET /api/provider/profile` - Get provider profile
- `PUT /api/provider/profile` - Update profile
- `PUT /api/provider/availability` - Toggle availability

### Earnings
- `GET /api/provider/earnings` - Get earnings data with date filters

## 🎨 Design System

### Colors
- **Primary**: Yellow (`#ffcc00`) - Trimly brand accent
- **Success**: Green (`#10B981`)
- **Warning**: Yellow (`#F59E0B`)  
- **Error**: Red (`#EF4444`)
- **Info**: Blue (`#3B82F6`)

### Components
- Consistent spacing and sizing
- Hover states and transitions
- Responsive design patterns
- Loading states and error handling
- Real-time notifications

## � Real-Time Features

### Socket.io Events
- `new_booking` - New booking request notification
- `booking_updated` - Booking status changes
- `booking_cancelled` - Booking cancellation
- `join_provider_room` - Join provider-specific room
- `leave_provider_room` - Leave provider room

### Real-Time Updates
- Instant booking notifications
- Live status synchronization
- Real-time availability updates
- Provider-customer communication

## 📱 Responsive Design

- Mobile-first approach
- Collapsible sidebar navigation
- Touch-friendly interface
- Optimized for all screen sizes
- Progressive enhancement

## 🔒 Security & Access Control

- **Provider-only access**: Strict role validation
- **Booking ownership**: Providers can only manage their bookings
- **Service ownership**: Providers can only manage their services
- **JWT validation**: Automatic token refresh and validation
- **Route protection**: All routes protected by authentication
- **API security**: Ownership validation on all booking updates

## 🧪 Development Notes

- Real-time Socket.io integration
- Comprehensive error handling
- Loading states for all async operations
- Form validation with user feedback
- Clean, maintainable code structure
- Environment-based configuration
- No hardcoded data - all API-driven

## 🚀 Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your web server

3. Configure environment variables for production

4. Ensure API endpoints are accessible and properly secured

5. Configure Socket.io for production environment

## 🔗 Integration with Existing Trimly Backend

This provider app is designed to seamlessly integrate with the existing Trimly MERN backend:

- **Compatible API endpoints**: Uses existing `/api/provider/*` routes
- **JWT authentication**: Works with existing auth middleware
- **Socket.io integration**: Compatible with existing socket configuration
- **Role validation**: Respects existing `role === "provider"` checks
- **Data models**: Works with existing User, Booking, Service schemas

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Use the established design system
3. Implement proper error handling
4. Add loading states for new features
5. Test responsive design
6. Ensure real-time features work correctly

## 📞 Support

For technical support or questions about the provider app, please contact your development team.

---

**Built with ❤️ for Trimly Service Providers - Complete Business Management Solution**
