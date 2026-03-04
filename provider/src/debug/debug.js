// Debug script to check provider availability status
console.log('=== DEBUG: Provider Availability Status ===');

const API_ORIGIN =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'https://trimly-backend-ramlal.onrender.com';
const API_BASE_URL = API_ORIGIN.endsWith('/api')
  ? API_ORIGIN
  : `${API_ORIGIN.replace(/\/$/, '')}/api`;

// Check current provider data from localStorage
const providerData = localStorage.getItem('providerData');
if (providerData) {
  const parsed = JSON.parse(providerData);
  console.log('Cached provider data:', parsed);
  console.log('Cached status:', parsed.status);
  console.log('Cached isAvailable (calculated):', parsed.status === 'active');
  console.log('Cached at:', new Date(parsed.cachedAt));
} else {
  console.log('No cached provider data found');
}

// Check token
const token = localStorage.getItem('providerToken');
console.log('Token exists:', !!token);

// Function to manually test API call
window.testProviderStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Direct API call result:', data);
    console.log('Status from API:', data.data?.status);
    console.log('isAvailable calculated:', data.data?.status === 'active');
  } catch (error) {
    console.error('Direct API call failed:', error);
  }
};

console.log('Run testProviderStatus() in console to test API call directly');
