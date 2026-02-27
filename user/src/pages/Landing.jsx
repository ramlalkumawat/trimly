import React, {useState, useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import { MapPin, Loader2, X } from 'lucide-react'
import { useLocation } from '../context/LocationContext'

// Landing / hero page. Centered layout with headline, location input and primary CTA.
export default function Landing(){
  // `loc` holds the controlled value for the location input
  const [loc, setLoc] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false)
  const [error, setError] = useState('')
  
  const inputRef = useRef(null)
  const autocompleteSuggestion = useRef(null)
  const placeService = useRef(null)
  const geocoder = useRef(null)
  
  const nav = useNavigate()
  const { updateLocation } = useLocation()

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          const mapElement = document.createElement('div');
          autocompleteSuggestion.current = new window.google.maps.places.AutocompleteSuggestion();
          placeService.current = new window.google.maps.places.Place({ id: 'dummy' });
          geocoder.current = new window.google.maps.Geocoder();
          console.log('Google Maps services initialized successfully');
          setError('');
        } catch (error) {
          console.error('Failed to initialize Google Maps services:', error);
          setError('Location services temporarily unavailable. You can still type your location manually.');
        }
      } else {
        console.log('Google Maps API not loaded yet, retrying...');
        setTimeout(initializeServices, 1000);
      }
    };

    // Start initialization
    initializeServices();
    
    // Also set up a one-time check after 5 seconds
    const fallbackTimer = setTimeout(() => {
      if (!autocompleteSuggestion.current) {
        console.log('Google Maps failed to load after 5 seconds');
        setError('Location services unavailable. You can still type your location manually.');
      }
    }, 5000);
    
    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Fetch place suggestions
  const fetchSuggestions = async (query) => {
    if (!query || !autocompleteSuggestion.current || !window.google || !window.google.maps.places) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const results = await new Promise((resolve, reject) => {
        autocompleteSuggestion.current.getPlaceSuggestions(
          {
            input: query,
            includedPrimaryTypes: ['geocode', 'establishment'],
            region: 'in' // Restrict to India
          },
          (results, status) => {
            if (status === (window.google.maps.places?.PlacesServiceStatus?.OK || 'OK')) {
              resolve(results.suggestions || []);
            } else {
              reject(new Error('Failed to fetch suggestions'));
            }
          }
        );
      });

      setSuggestions(results || []);
    } catch (err) {
      console.error('Suggestions fetch error:', err);
      setError('Failed to fetch location suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loc) {
        fetchSuggestions(loc);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [loc]);

  // Handle suggestion selection
  const handleSuggestionSelect = async (place) => {
    if (!placeService.current || !window.google || !window.google.maps.places) {
      setError('Location services not available');
      return;
    }

    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const selectedPlace = new window.google.maps.places.Place({ id: place.placeId || place.place_id });
      await selectedPlace.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
      });

      const locationData = {
        address: selectedPlace.formattedAddress || selectedPlace.displayName,
        latitude: selectedPlace.location?.lat(),
        longitude: selectedPlace.location?.lng(),
        placeId: place.placeId || place.place_id
      };

      // Update input and global state
      setLoc(selectedPlace.formattedAddress || selectedPlace.displayName);
      await updateLocation(locationData);
    } catch (err) {
      console.error('Place details error:', err);
      setError('Failed to get location details');
    } finally {
      setLoading(false);
    }
  };

  // Handle current location
  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setCurrentLocationLoading(true);
    setError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      if (!geocoder.current || !window.google || !window.google.maps) {
        setError('Location services not available');
        return;
      }

      const results = await new Promise((resolve, reject) => {
        geocoder.current.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === (window.google.maps?.GeocoderStatus?.OK || 'OK') && results[0]) {
              resolve(results);
            } else {
              reject(new Error('Failed to get address from coordinates'));
            }
          }
        );
      });

      const locationData = {
        address: results[0].formatted_address,
        latitude,
        longitude,
        placeId: null
      };

      // Update input and global state
      setLoc(results[0].formatted_address);
      await updateLocation(locationData);
    } catch (err) {
      console.error('Current location error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      if (err.code === 1) {
        setError('Location access denied. Please enable location permissions in your browser settings.');
      } else if (err.code === 2) {
        setError('Location unavailable. Please check your device location settings.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else if (err.message && err.message.includes('Failed to get address from coordinates')) {
        setError('Unable to determine your address. Please try entering your location manually.');
      } else {
        setError('Failed to get your location. Please try entering your location manually.');
      }
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setLoc(e.target.value);
    setError('');
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (loc) {
      setShowSuggestions(true);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-4.5rem)] flex items-center">
        <div className="w-full max-w-3xl mx-auto px-4 text-center">
          {/* Headline - bold, large, and using primary text color */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-[var(--text-primary)]">Book Professional Salon Services At Home in <span className="text-yellow-500 font-bold">30 Minutes</span></h1>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Trusted professionals, easy booking, and salon-quality results at your doorstep.</p>

          <div className="mt-8">
            {/* Enhanced Location input with Google Places Autocomplete */}
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <div className="text-left relative" ref={inputRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Location</label>
                <div className="relative">
                  <Input 
                    value={loc} 
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder="Enter your city" 
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10" 
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Google Places Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId || suggestion.place_id}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.text?.mainText || suggestion.structured_formatting?.main_text}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {suggestion.text?.secondaryText || suggestion.structured_formatting?.secondary_text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
              </div>
              
              {/* Use Current Location Button */}
              <button
                onClick={handleCurrentLocation}
                disabled={currentLocationLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentLocationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                {currentLocationLoading ? 'Getting Location...' : 'Use Current Location'}
              </button>
              
              <button onClick={()=>nav('/services')} className="w-full px-6 py-3 rounded-2xl btn-primary font-semibold">Find Services</button>
            </div>
            <div className="mt-4 text-xs text-gray-500">We'll show nearby professionals available in your area.</div>
          </div>

          {/* Optional hero visual placeholder for larger screens */}
          <div className="mt-10 bg-white rounded-2xl shadow-soft p-6 hidden sm:block">
            <div className="h-48 flex items-center justify-center text-gray-300">Hero Image Placeholder</div>
          </div>
        </div>
      </section>

      {/* What are you looking for? Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">What are you looking for?</h2>
          <p className="text-center text-gray-600 mb-12">Choose from our most popular home salon services</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center font-medium bg-white cursor-pointer hover:scale-105">
              <div className="text-3xl mb-3">💇</div>
              Haircut at Home
            </div>
            <div className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center font-medium bg-white cursor-pointer hover:scale-105">
              <div className="text-3xl mb-3">✂️</div>
              Beard Styling
            </div>
            <div className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center font-medium bg-white cursor-pointer hover:scale-105">
              <div className="text-3xl mb-3">🧴</div>
              Facial & Cleanup
            </div>
            <div className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center font-medium bg-white cursor-pointer hover:scale-105">
              <div className="text-3xl mb-3">💆</div>
              Massage at Home
            </div>
          </div>
        </div>
      </section>

      {/* Most Booked Services Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Most Booked Services</h2>
          <p className="text-center text-gray-600 mb-12">Our customers' favorite treatments</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl shadow-lg p-8 bg-white text-center hover:shadow-xl transition-all duration-300">
              <div className="text-4xl mb-4">💇‍♂️</div>
              <h3 className="text-xl font-semibold mb-2">Men's Haircut</h3>
              <p className="text-gray-600">Professional haircut at your convenience</p>
            </div>
            <div className="rounded-2xl shadow-lg p-8 bg-white text-center hover:shadow-xl transition-all duration-300">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">Detan Facial</h3>
              <p className="text-gray-600">Rejuvenating facial treatment</p>
            </div>
            <div className="rounded-2xl shadow-lg p-8 bg-white text-center hover:shadow-xl transition-all duration-300">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-semibold mb-2">Deep Tissue Massage</h3>
              <p className="text-gray-600">Relaxing massage therapy at home</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Trimly? Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why Choose Trimly?</h2>
          <p className="text-center text-gray-600 mb-12">Experience the best home salon service</p>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="p-6 bg-white rounded-2xl shadow-lg text-center font-semibold hover:shadow-xl transition-all duration-300">
              <div className="text-3xl mb-3">⏰</div>
              <h3 className="text-lg mb-2">30-Min Arrival</h3>
              <p className="text-sm text-gray-600 font-normal">Quick service at your doorstep</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-lg text-center font-semibold hover:shadow-xl transition-all duration-300">
              <div className="text-3xl mb-3">👨‍💼</div>
              <h3 className="text-lg mb-2">Skilled Professionals</h3>
              <p className="text-sm text-gray-600 font-normal">Experienced and verified experts</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-lg text-center font-semibold hover:shadow-xl transition-all duration-300">
              <div className="text-3xl mb-3">🧼</div>
              <h3 className="text-lg mb-2">Hygienic Tools</h3>
              <p className="text-sm text-gray-600 font-normal">Sanitized equipment for safety</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-lg text-center font-semibold hover:shadow-xl transition-all duration-300">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-lg mb-2">Easy Rescheduling</h3>
              <p className="text-sm text-gray-600 font-normal">Flexible booking management</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
