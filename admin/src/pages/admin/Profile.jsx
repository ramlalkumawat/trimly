import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';

// Admin profile page for viewing/updating personal account details.
export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await adminAPI.profile.get();
      setProfileData(response.data.data);
      setFormData({
        name: response.data.data.admin.name,
        email: response.data.data.admin.email || '',
        phone: response.data.data.admin.phone
      });
    } catch (error) {
      toast.addToast('Failed to fetch profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await adminAPI.profile.update(formData);
      setProfileData(prev => ({
        ...prev,
        admin: response.data.data
      }));
      setEditing(false);
      toast.addToast('Profile updated successfully', 'success');
    } catch (error) {
      toast.addToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profileData) {
      setFormData({
        name: profileData.admin.name,
        email: profileData.admin.email || '',
        phone: profileData.admin.phone
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-8">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.admin?.id || 'admin'}`}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-gray-200"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profileData?.admin?.name}</h2>
              <p className="text-gray-600">Administrator</p>
              <p className="text-sm text-gray-500">Member since {new Date(profileData?.admin?.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData?.admin?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData?.admin?.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData?.admin?.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <p className="text-gray-900 capitalize">{profileData?.admin?.role}</p>
            </div>
          </div>

          {/* Edit Form Actions */}
          {editing && (
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Card */}
      <div className="bg-white rounded-lg shadow-md mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Statistics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{profileData?.stats?.totalUsers || 0}</div>
              <div className="text-gray-600 mt-1">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{profileData?.stats?.totalProviders || 0}</div>
              <div className="text-gray-600 mt-1">Total Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{profileData?.stats?.totalBookings || 0}</div>
              <div className="text-gray-600 mt-1">Total Bookings</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{profileData?.stats?.activeProviders || 0}</div>
              <div className="text-gray-600 mt-1">Active Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">₹{profileData?.stats?.totalRevenue || 0}</div>
              <div className="text-gray-600 mt-1">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
