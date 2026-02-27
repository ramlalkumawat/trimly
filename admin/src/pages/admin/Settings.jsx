import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import useToast from '../../hooks/useToast';

// Account/security/preferences settings with save and logout actions.
const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Trimly Admin',
    maintenanceMode: false,
    emailNotifications: true,
    pushNotifications: true
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Update profile API call
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    try {
      // TODO: Change password API call
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Update system settings API call
      toast.success('System settings updated successfully');
    } catch (error) {
      toast.error('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (form, setForm) => (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'about', label: 'About', icon: 'ℹ️' }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your account settings and system preferences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="First Name"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleInputChange(profileForm, setProfileForm)}
                      required
                    />
                    <FormInput
                      label="Last Name"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleInputChange(profileForm, setProfileForm)}
                      required
                    />
                  </div>
                  <FormInput
                    label="Email Address"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleInputChange(profileForm, setProfileForm)}
                    required
                  />
                  <FormInput
                    label="Phone Number"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleInputChange(profileForm, setProfileForm)}
                  />
                  <FormActions
                    onCancel={() => setProfileForm({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      phone: user?.phone || ''
                    })}
                    loading={loading}
                  />
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit}>
                    <FormInput
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handleInputChange(passwordForm, setPasswordForm)}
                      required
                    />
                    <FormInput
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handleInputChange(passwordForm, setPasswordForm)}
                      required
                    />
                    <FormInput
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handleInputChange(passwordForm, setPasswordForm)}
                      required
                    />
                    <FormActions
                      onCancel={() => setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })}
                      loading={loading}
                    />
                  </form>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Session Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Current Session</p>
                        <p className="text-sm text-gray-500">Active now • {user?.email}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">System Settings</h3>
                <form onSubmit={handleSystemSettingsSubmit}>
                  <FormInput
                    label="Site Name"
                    name="siteName"
                    value={systemSettings.siteName}
                    onChange={handleInputChange(systemSettings, setSystemSettings)}
                  />
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="maintenanceMode"
                        checked={systemSettings.maintenanceMode}
                        onChange={handleInputChange(systemSettings, setSystemSettings)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Maintenance Mode</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={systemSettings.emailNotifications}
                        onChange={handleInputChange(systemSettings, setSystemSettings)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={systemSettings.pushNotifications}
                        onChange={handleInputChange(systemSettings, setSystemSettings)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
                    </label>
                  </div>
                  <FormActions
                    onCancel={() => setSystemSettings({
                      siteName: 'Trimly Admin',
                      maintenanceMode: false,
                      emailNotifications: true,
                      pushNotifications: true
                    })}
                    loading={loading}
                  />
                </form>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">About Trimly Admin</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Version Information</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Version</dt>
                        <dd className="text-sm text-gray-900">1.0.0</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Build</dt>
                        <dd className="text-sm text-gray-900">Production</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Last Updated</dt>
                        <dd className="text-sm text-gray-900">February 21, 2026</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-base font-medium text-gray-900">System Information</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Environment</dt>
                        <dd className="text-sm text-gray-900">Production</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Database</dt>
                        <dd className="text-sm text-gray-900">MongoDB</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">API Version</dt>
                        <dd className="text-sm text-gray-900">v1.0.0</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-base font-medium text-gray-900">Support</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      For technical support or questions, please contact your system administrator.
                    </p>
                    <div className="mt-3 space-y-2">
                      <a href="#" className="block text-sm text-amber-600 hover:text-amber-700">
                        Documentation →
                      </a>
                      <a href="#" className="block text-sm text-amber-600 hover:text-amber-700">
                        API Reference →
                      </a>
                      <a href="#" className="block text-sm text-amber-600 hover:text-amber-700">
                        Support Portal →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
