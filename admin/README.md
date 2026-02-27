# Trimly Admin Dashboard

A production-ready admin dashboard for the Trimly hyperlocal salon startup, built with modern React technologies and featuring comprehensive CRUD operations for all business entities.

## 🚀 Tech Stack

- **React** (v18) + **Vite** for fast development
- **Tailwind CSS** for premium, modern styling with amber accent
- **React Router DOM** for client-side routing
- **Axios** with interceptors for API communication
- **JWT Authentication** with automatic token refresh
- **Recharts** for real-time analytics and data visualization
- **Heroicons** for consistent iconography
- **React Spinners** for loading states

## 📋 Features

### 🔐 Authentication & Security
- JWT-based authentication with automatic token refresh
- Role-based access control (admin-only)
- Protected routes with automatic redirect
- Token expiration handling and auto-logout
- Secure API communication with interceptors

### 👥 Users Management
- Full CRUD operations (Create, Read, Update, Delete)
- Server-side pagination and search with debounce
- Status management (active/inactive)
- Role assignment (user/admin)
- Detailed user profiles with audit trails

### 💇 Providers Management  
- Complete provider lifecycle management
- Document verification system
- Approval/rejection workflow
- Commission rate configuration
- Performance tracking and statistics
- Soft delete implementation

### 🛠️ Services Management
- Service catalog with categories
- Pricing and duration management
- Commission percentage configuration
- Active/inactive status control
- Image support for services
- Category-based filtering

### 📅 Bookings Management
- Comprehensive booking control
- Status workflow (pending → confirmed → in-progress → completed)
- Date range filtering
- Provider and user linking
- Real-time status updates
- Booking details with full context

### 💳 Payments Processing
- Transaction management and tracking
- Revenue summary and analytics
- Refund processing with confirmation
- Payment status badges
- Commission calculation
- Multiple payment method support

### 📊 Analytics Dashboard
- Real-time business metrics
- Revenue trend analysis with line charts
- Booking growth visualization
- Service distribution pie charts
- Top performing providers table
- Recent activity feed

### ⚙️ System Settings
- Profile management
- Password change functionality
- System configuration
- Maintenance mode toggle
- Notification preferences

## 🏗️ Architecture

### Folder Structure
```
src/
 ├── components/
 │   ├── common/          # Toast notifications
 │   ├── forms/           # Reusable form components
 │   ├── layout/          # Loading skeletons
 │   ├── modals/          # Modal components
 │   └── tables/          # Data table component
 ├── hooks/               # Custom React hooks
 ├── pages/admin/         # Admin panel pages
 │   ├── Dashboard.jsx
 │   ├── Users.jsx
 │   ├── Providers.jsx
 │   ├── Services.jsx
 │   ├── Bookings.jsx
 │   ├── Payments.jsx
 │   ├── Analytics.jsx
 │   └── Settings.jsx
 ├── routes/              # Route protection
 ├── utils/               # API utilities
 └── context/             # Authentication context
```

### API Integration
- Centralized API configuration in `src/utils/api.js`
- Automatic JWT token attachment
- Global error handling with 401 redirect
- Environment-based configuration
- Comprehensive endpoint coverage

### Component Design
- Reusable DataTable with sorting, pagination, search
- Modal system for forms and confirmations
- FormInput component with validation
- Loading skeletons for better UX
- Toast notification system

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

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Environment
VITE_NODE_ENV=development

# Optional integrations
# VITE_STRIPE_PUBLIC_KEY=pk_test_...
# VITE_GOOGLE_MAPS_API_KEY=...
```

## 📡 API Endpoints

The dashboard expects the following API structure:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `POST /api/auth/refresh` - Token refresh

### Users
- `GET /api/admin/users` - List users with pagination
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/status` - Update status
- `DELETE /api/admin/users/:id` - Soft delete user

### Providers
- `GET /api/admin/providers` - List providers
- `POST /api/admin/providers` - Create provider
- `PUT /api/admin/providers/:id` - Update provider
- `PATCH /api/admin/providers/:id/verify` - Verify provider
- `DELETE /api/admin/providers/:id` - Soft delete provider

### Services
- `GET /api/admin/services` - List services
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

### Bookings
- `GET /api/admin/bookings` - List bookings
- `PUT /api/admin/bookings/:id` - Update booking
- `DELETE /api/admin/bookings/:id` - Delete booking

### Payments
- `GET /api/admin/payments` - List payments
- `POST /api/admin/payments/refund/:id` - Process refund

### Analytics
- `GET /api/admin/analytics` - Dashboard analytics

## 🎨 Design System

### Colors
- **Primary**: Amber (`#F59E0B`) - Brand accent
- **Success**: Green (`#10B981`)
- **Warning**: Yellow (`#F59E0B`)  
- **Error**: Red (`#EF4444`)
- **Info**: Blue (`#3B82F6`)

### Typography
- Clean, modern font stack
- Consistent heading hierarchy
- Readable body text

### Components
- Consistent spacing and sizing
- Hover states and transitions
- Responsive design patterns
- Loading states and error handling

## 🔒 Security Features

- JWT token validation and refresh
- Role-based access control
- Automatic logout on token expiration
- Secure API communication
- Input validation and sanitization
- Soft delete for data integrity

## 📱 Responsive Design

- Mobile-first approach
- Collapsible sidebar navigation
- Responsive data tables
- Touch-friendly interface
- Optimized for all screen sizes

## 🧪 Development Notes

- No hardcoded data - all API-driven
- Comprehensive error handling
- Loading states for all async operations
- Debounced search inputs
- Form validation with user feedback
- Clean, maintainable code structure

## 🚀 Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your web server

3. Configure environment variables for production

4. Ensure API endpoints are accessible and properly secured

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Use the established design system
3. Implement proper error handling
4. Add loading states for new features
5. Test responsive design

## 📞 Support

For technical support or questions about the admin dashboard, please contact your development team.

---

**Built with ❤️ for Trimly - Premium Salon Management Platform**
