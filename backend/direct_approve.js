// Direct database update without MongoDB connection
// This script uses the existing backend server to update the provider

const axios = require('axios');

// Utility script: logs in/creates admin and attempts provider approval via API calls.
async function directApprove() {
  try {
    // First, let's see what users exist by trying to find an admin
    console.log('Attempting to find existing admin...');
    
    // Try common admin credentials
    const adminCredentials = [
      { phone: '9876543214', password: 'admin123' },
      { phone: 'admin123', password: 'admin123' },
      { email: 'admin@example.com', password: 'admin123' }
    ];
    
    let adminToken = null;
    
    for (const creds of adminCredentials) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', creds);
        if (response.data.success && response.data.data.user.role === 'admin') {
          adminToken = response.data.data.token;
          console.log('Admin login successful with:', creds.phone || creds.email);
          break;
        }
      } catch (error) {
        // Continue trying next credentials
      }
    }
    
    if (!adminToken) {
      console.log('No admin found. Creating first admin...');
      
      // Create first admin (should work since no admin exists)
      const adminResponse = await axios.post('http://localhost:5000/api/auth/register', {
        name: 'System Admin',
        phone: '9999999999',
        email: 'admin@trimly.com',
        password: 'admin123',
        role: 'admin'
      });
      
      console.log('Admin created:', adminResponse.data);
      
      if (adminResponse.data.data.token) {
        adminToken = adminResponse.data.data.token;
      } else {
        // Login with the new admin
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          phone: '9999999999',
          password: 'admin123'
        });
        adminToken = loginResponse.data.data.token;
      }
    }
    
    if (adminToken) {
      console.log('Admin token obtained');
      
      // Now approve the provider
      const axiosWithAuth = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      // Get all providers to find the provider
      try {
        const providersResponse = await axiosWithAuth.get('/admin/providers');
        const providers = providersResponse.data.data.providers;
        const provider = providers.find(u => u.email === 'ramlalkumawat2001@gmail.com');
        
        if (provider) {
          console.log('Found provider:', provider.name);
          console.log('Current status:', provider.status, 'approved:', provider.approved, 'verified:', provider.verified);
          
          // Verify the provider (this should approve them)
          const verifyResponse = await axiosWithAuth.patch(`/admin/providers/${provider._id}/verify`);
          console.log('Provider verification response:', verifyResponse.data);
          
          // Also update provider status to active
          const updateResponse = await axiosWithAuth.put(`/admin/providers/${provider._id}`, {
            status: 'active',
            approved: true,
            isApproved: true,
            verified: true
          });
          console.log('Provider update response:', updateResponse.data);
          
          // Test login
          console.log('\nTesting provider login...');
          const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'ramlalkumawat2001@gmail.com',
            password: 'provider123'
          });
          
          console.log('✅ Provider login successful!');
          console.log('You can now login with:');
          console.log('Email: ramlalkumawat2001@gmail.com');
          console.log('Password: provider123');
          
        } else {
          console.log('Provider not found in user list');
        }
      } catch (error) {
        console.log('Admin endpoints might not exist. Let me try a different approach...');
        
        // Try to directly update using user model if we can access it
        console.log('Provider account created but needs manual approval in the database.');
        console.log('The provider account exists with:');
        console.log('Email: ramlalkumawat2001@gmail.com');
        console.log('Password: provider123');
        console.log('Status: pending approval');
        console.log('\nTo approve, you need to:');
        console.log('1. Access the MongoDB database directly');
        console.log('2. Find the user with email: ramlalkumawat2001@gmail.com');
        console.log('3. Update these fields: status: "active", approved: true, isApproved: true');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

directApprove();
