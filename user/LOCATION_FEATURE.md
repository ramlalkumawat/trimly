# Google Location Selection Modal

A comprehensive location selection system for Trimly with Google Maps integration.

## Features

### 🗺️ Google Places Integration
- **Autocomplete Suggestions**: Real-time location search with Google Places API
- **Current Location**: Browser geolocation with reverse geocoding
- **Smart Filtering**: Restricted to India by default
- **Place Details**: Complete address information with coordinates

### 🎨 Beautiful UI/UX
- **Responsive Design**: Works perfectly on mobile and desktop
- **Smooth Animations**: Elegant transitions and hover effects
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages

### 🔒 Secure Backend Integration
- **JWT Authentication**: Protected API endpoints
- **Data Validation**: Server-side coordinate and address validation
- **Error Handling**: Comprehensive error management
- **Database Storage**: Persistent location storage

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the user directory:

```bash
# Copy from example
cp .env.example .env
```

Add your Google Maps API key:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_API_URL=http://localhost:5000
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API** 
   - **Geocoding API**
4. Create credentials (API Key)
5. Restrict your API key for security:
   - HTTP referrers: Your domain
   - API restrictions: Only the three APIs above

### 3. Backend Setup

The backend is already configured with:
- `/api/user/location` POST endpoint
- JWT authentication middleware
- User model with location schema
- Coordinate validation

## Usage

### Opening the Modal
The location modal can be opened from:
- **Desktop**: Location selector in navbar
- **Mobile**: Location pin icon in navbar

### Selecting Location
Users have two options:

1. **Search**: Type any location/society/apartment name
2. **Current Location**: Use device GPS (requires permission)

### Data Stored
When a location is selected, the following is stored:
- **Formatted Address**: Complete address string
- **Latitude & Longitude**: GPS coordinates
- **Place ID**: Google Places identifier
- **Timestamp**: When location was set

### Storage Locations
- **Local State**: React context for immediate UI updates
- **LocalStorage**: Browser persistence for offline usage
- **Database**: Backend storage for logged-in users

## Components

### LocationModal.jsx
Main modal component with:
- Google Places autocomplete
- Current location detection
- Error handling and loading states
- Responsive design

### LocationContext.jsx
Global state management:
- Location state synchronization
- Backend API integration
- LocalStorage persistence
- Error handling

### Updated Components
- **Navbar.jsx**: Location selector integration
- **App.jsx**: Location provider wrapper
- **User Model**: Location schema support

## API Endpoints

### POST /api/user/location
Updates user location in database.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "address": "123 Main St, Mumbai, Maharashtra 400001, India",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "placeId": "ChIJd3AaY..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "address": "123 Main St, Mumbai, Maharashtra 400001, India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Handling

### Frontend Errors
- **Permission Denied**: User blocks location access
- **Network Issues**: API connectivity problems
- **Invalid Data**: Malformed coordinates or addresses
- **Timeout**: Location request takes too long

### Backend Errors
- **Validation**: Missing required fields
- **Authentication**: Invalid or expired JWT
- **Database**: Connection or update failures
- **Coordinates**: Invalid latitude/longitude values

## Security Features

### API Key Protection
- Environment variable storage
- Domain restriction in Google Cloud
- API-specific restrictions

### Data Validation
- Frontend: Input sanitization
- Backend: Schema validation
- Coordinate bounds checking

### Authentication
- JWT required for backend updates
- Token expiration handling
- Automatic logout on auth failure

## Browser Compatibility

### Supported Features
- **Geolocation API**: Modern browsers
- **Google Maps**: All major browsers
- **LocalStorage**: Persistent storage
- **Responsive Design**: Mobile & desktop

### Fallbacks
- Manual location entry if GPS fails
- Local storage if backend unavailable
- Graceful degradation for older browsers

## Performance Optimizations

### Frontend
- **Debounced Search**: 300ms delay for API calls
- **Component Caching**: React.memo for expensive renders
- **Lazy Loading**: Modal loads only when needed

### Backend
- **Database Indexes**: Location field optimization
- **Validation Caching**: Schema validation caching
- **Error Limits**: Rate limiting for protection

## Testing

### Manual Testing Checklist
- [ ] Modal opens from navbar
- [ ] Search suggestions appear
- [ ] Current location works
- [ ] Location saves to backend
- [ ] Error messages display
- [ ] Mobile responsive
- [ ] Loading states show
- [ ] Permissions handled

### Automated Tests
```javascript
// Example test cases
describe('Location Modal', () => {
  test('opens and closes correctly')
  test('fetches suggestions on search')
  test('handles current location permission')
  test('validates coordinates')
  test('saves location to backend')
})
```

## Troubleshooting

### Common Issues

**API Key Not Working**
- Check Google Cloud Console setup
- Verify API restrictions
- Check environment variable name

**Location Permission Denied**
- Check browser settings
- Use HTTPS (required for geolocation)
- Try manual search instead

**Backend Connection Failed**
- Verify backend is running
- Check CORS configuration
- Validate JWT token

**Coordinates Invalid**
- Check coordinate ranges
- Verify geocoding results
- Test with known locations

### Debug Mode
Enable console logging:
```javascript
// In LocationModal.jsx
console.log('Location data:', locationData);
console.log('API response:', response);
```

## Future Enhancements

### Planned Features
- **Location History**: Save multiple locations
- **Service Areas**: Radius-based availability
- **Map Preview**: Visual location confirmation
- **Address Editing**: Manual address correction
- **Location Sharing**: Share with family members

### Technical Improvements
- **Offline Support**: Service worker caching
- **Performance**: Virtual scrolling for suggestions
- **Analytics**: Location usage tracking
- **A11y**: Screen reader improvements
