import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';

// Reusable modal for selecting address using Google Places or current geolocation.
export default function LocationModal({ isOpen, onClose, onLocationSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const autocompleteSuggestion = useRef(null);
  const placeService = useRef(null);
  const geocoder = useRef(null);

  // Initialize Google Maps services
  useEffect(() => {
    if (!window.google || !isOpen) return;

    const mapElement = document.createElement('div');
    autocompleteSuggestion.current = new window.google.maps.places.AutocompleteSuggestion();
    placeService.current = new window.google.maps.places.Place({ id: 'dummy' });
    geocoder.current = new window.google.maps.Geocoder();
  }, [isOpen]);

  // Fetch place suggestions
  const fetchSuggestions = async (query) => {
    if (!query || !autocompleteSuggestion.current) {
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
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results.suggestions || []);
            } else {
              reject(new Error('Failed to fetch suggestions'));
            }
          }
        );
      });

      setSuggestions(results || []);
    } catch (err) {
      setError('Failed to fetch location suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle suggestion selection
  const handleSuggestionSelect = async (place) => {
    if (!placeService.current) return;

    setLoading(true);
    setError('');

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

      onLocationSelect(locationData);
      onClose();
    } catch (err) {
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
      if (!geocoder.current) return;

      const results = await new Promise((resolve, reject) => {
        geocoder.current.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
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

      onLocationSelect(locationData);
      onClose();
    } catch (err) {
      if (err.code === 1) {
        setError('Location access denied. Please enable location permissions.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Failed to get your location. Please try again.');
      }
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Select Location</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search input */}
          <div className="relative mb-4">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your location/society/apartment"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              autoFocus
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Current location button */}
          <button
            onClick={handleCurrentLocation}
            disabled={currentLocationLoading}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentLocationLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
            {currentLocationLoading ? 'Getting Location...' : 'Use Current Location'}
          </button>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId || suggestion.place_id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.text?.mainText || suggestion.structured_formatting?.main_text}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {suggestion.text?.secondaryText || suggestion.structured_formatting?.secondary_text}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && searchQuery && suggestions.length === 0 && !error && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No locations found</p>
              <p className="text-sm text-gray-400 mt-1">Try searching for a different location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
