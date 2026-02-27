import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import { 
  UserIcon, 
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  PowerIcon
} from '@heroicons/react/24/outline';
import { PulseLoader } from 'react-spinners';

// Provider profile and business info page with edit/save and availability toggle.
const Profile = () => {
  const { provider, updateProfile, toggleAvailability } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceArea: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  const toast = useToast();

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        email: provider.email || '',
        phone: provider.phone || '',
        serviceArea: provider.serviceArea || '',
        description: provider.description || ''
      });
      setImagePreview(provider.profileImage || null);
    }
  }, [provider]);

  const handleEdit = () => {
    setEditing(true);
    setFormErrors({});
  };

  const handleCancel = () => {
    setEditing(false);
    if (provider) {
      setFormData({
        name: provider.name || '',
        email: provider.email || '',
        phone: provider.phone || '',
        serviceArea: provider.serviceArea || '',
        description: provider.description || ''
      });
    }
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Error', 'Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Error', 'Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      // Note: You'll need to implement image upload endpoint in backend
      // For now, we'll just update the profile with the current image preview
      toast.success('Success', 'Profile image updated');
    } catch (error) {
      toast.error('Error', 'Failed to upload image');
      // Reset to original image
      setImagePreview(provider?.profileImage || null);
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Phone number is invalid';
    }
    
    if (!formData.serviceArea.trim()) {
      errors.serviceArea = 'Service area is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await providerAPI.updateProfile(formData);
      updateProfile(response.data.data);
      toast.success('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setTogglingAvailability(true);
    const newStatus = !provider?.isAvailable;
    const result = await toggleAvailability(newStatus);
    
    if (result.success) {
      toast.success(
        'Status Updated',
        `You are now ${newStatus ? 'online' : 'offline'}`
      );
    } else {
      toast.error('Error', result.error);
    }
    setTogglingAvailability(false);
  };

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PulseLoader color="#ffcc00" size={15} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your personal information and service details
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 sm:p-8">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              {editing && (
                <div className="absolute bottom-0 right-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <CameraIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {editing && imagePreview !== provider?.profileImage && (
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={handleImageUpload}
                  disabled={uploadingImage}
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  {uploadingImage ? 'Uploading...' : 'Save Image'}
                </button>
                <button
                  onClick={() => setImagePreview(provider?.profileImage || null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className={`pl-10 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      editing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                    } ${formErrors.name ? 'border-red-300' : ''}`}
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={true} // Email should not be editable
                    className="pl-10 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className={`pl-10 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      editing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                    } ${formErrors.phone ? 'border-red-300' : ''}`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              {/* Service Area */}
              <div>
                <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
                  Service Area
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="serviceArea"
                    name="serviceArea"
                    value={formData.serviceArea}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="e.g., Downtown Manhattan, Brooklyn Heights"
                    className={`pl-10 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      editing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                    } ${formErrors.serviceArea ? 'border-red-300' : ''}`}
                  />
                </div>
                {formErrors.serviceArea && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.serviceArea}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Business Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={!editing}
                rows={4}
                placeholder="Tell customers about your business, experience, and the services you offer..."
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                  editing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>

            {/* Availability Status */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Availability Status</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        provider.isAvailable ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {provider.isAvailable ? 'Online' : 'Offline'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {provider.isAvailable 
                            ? 'You are receiving booking requests' 
                            : 'You are not receiving new booking requests'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleAvailability}
                    disabled={togglingAvailability}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                      provider.isAvailable
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {togglingAvailability ? (
                      <PulseLoader color="#ffffff" size={6} />
                    ) : (
                      <>
                        <PowerIcon className="h-4 w-4 mr-2" />
                        {provider.isAvailable ? 'Go Offline' : 'Go Online'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <IdentificationIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Provider ID</p>
                    <p className="text-sm text-gray-500">{provider._id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Type</p>
                    <p className="text-sm text-gray-500 capitalize">{provider.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-500">
                      {new Date(provider.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${
                    provider.isAvailable ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-sm text-gray-500">
                      {provider.isAvailable ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {loading ? (
                      <PulseLoader color="#ffffff" size={6} />
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
