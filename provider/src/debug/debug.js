// Debug script to check provider availability status
console.log('=== DEBUG: Provider Availability Status ===');

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
    const response = await fetch('http://localhost:5000/api/provider/profile', {
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
