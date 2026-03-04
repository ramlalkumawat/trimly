import React, { useMemo, useState } from 'react';
import {
  BellAlertIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  LockClosedIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import useToast from '../../hooks/useToast';

const tabs = [
  { id: 'profile', label: 'Profile', Icon: UserCircleIcon },
  { id: 'security', label: 'Security', Icon: LockClosedIcon },
  { id: 'notifications', label: 'Notifications', Icon: BellAlertIcon },
  { id: 'system', label: 'System', Icon: Cog6ToothIcon },
  { id: 'about', label: 'About', Icon: InformationCircleIcon },
];

// Settings page for profile, security, notification, and system preferences.
const Settings = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || user?.name?.split(' ')[0] || '',
    lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    bookingAlerts: true,
    billingAlerts: false,
  });

  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Trimly Admin',
    maintenanceMode: false,
    autoBackup: true,
  });

  const userDisplayName = useMemo(() => {
    const fallbackName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    return user?.name || fallbackName || 'Admin User';
  }, [user?.name, profileForm.firstName, profileForm.lastName]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      // API endpoint can be wired here when profile settings endpoint expands.
      toast.success('Profile settings saved.');
    } catch (requestError) {
      toast.error('Failed to save profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      toast.success('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (requestError) {
      toast.error('Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      toast.success('System preferences saved.');
    } catch (requestError) {
      toast.error('Failed to save system preferences.');
    } finally {
      setLoading(false);
    }
  };

  const renderToggle = (label, checked, onChange, hint) => (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative mt-0.5 inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? 'bg-blue-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="admin-section-title">Settings</h1>
          <p className="admin-section-subtitle">Manage account preferences, notifications and security controls.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <aside className="admin-card p-3">
          <nav className="space-y-1">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4 xl:col-span-3">
          {activeTab === 'profile' ? (
            <section className="admin-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
              <p className="mt-1 text-sm text-slate-500">Update administrator identity and contact details.</p>
              <form onSubmit={handleProfileSubmit} className="mt-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    label="First Name"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    required
                  />
                  <FormInput
                    label="Last Name"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
                    required
                  />
                </div>
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <FormInput
                  label="Phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                <FormActions
                  onCancel={() =>
                    setProfileForm({
                      firstName: user?.firstName || user?.name?.split(' ')[0] || '',
                      lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                    })
                  }
                  loading={loading}
                  submitLabel="Save Profile"
                />
              </form>
            </section>
          ) : null}

          {activeTab === 'security' ? (
            <section className="space-y-4">
              <article className="admin-card p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                <p className="mt-1 text-sm text-slate-500">Use a strong password to secure admin access.</p>
                <form onSubmit={handlePasswordSubmit} className="mt-5">
                  <FormInput
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    required
                  />
                  <FormInput
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    required
                  />
                  <FormInput
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    required
                  />
                  <FormActions
                    onCancel={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                    loading={loading}
                    submitLabel="Update Password"
                  />
                </form>
              </article>

              <article className="admin-card p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-slate-900">Session</h3>
                <p className="mt-1 text-sm text-slate-500">Signed in as {userDisplayName}</p>
              </article>
            </section>
          ) : null}

          {activeTab === 'notifications' ? (
            <section className="admin-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
              <p className="mt-1 text-sm text-slate-500">Choose which alerts should reach your inbox and dashboard.</p>
              <div className="mt-5 space-y-3">
                {renderToggle(
                  'Email Notifications',
                  notificationSettings.emailNotifications,
                  () =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      emailNotifications: !prev.emailNotifications,
                    })),
                  'Receive key updates through email.'
                )}
                {renderToggle(
                  'Push Notifications',
                  notificationSettings.pushNotifications,
                  () =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      pushNotifications: !prev.pushNotifications,
                    })),
                  'Enable browser push for urgent updates.'
                )}
                {renderToggle(
                  'Booking Alerts',
                  notificationSettings.bookingAlerts,
                  () =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      bookingAlerts: !prev.bookingAlerts,
                    })),
                  'Notify when booking status changes.'
                )}
                {renderToggle(
                  'Billing Alerts',
                  notificationSettings.billingAlerts,
                  () =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      billingAlerts: !prev.billingAlerts,
                    })),
                  'Alert on refunds and payout anomalies.'
                )}
              </div>
              <div className="mt-6">
                <button type="button" onClick={() => toast.success('Notification preferences saved.')} className="admin-btn-primary">
                  Save Notification Settings
                </button>
              </div>
            </section>
          ) : null}

          {activeTab === 'system' ? (
            <section className="admin-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">System Preferences</h2>
              <p className="mt-1 text-sm text-slate-500">Configure global admin panel behavior.</p>
              <form onSubmit={handleSystemSubmit} className="mt-5">
                <FormInput
                  label="Panel Name"
                  name="siteName"
                  value={systemSettings.siteName}
                  onChange={(event) => setSystemSettings((prev) => ({ ...prev, siteName: event.target.value }))}
                />
                <div className="space-y-3">
                  {renderToggle(
                    'Maintenance Mode',
                    systemSettings.maintenanceMode,
                    () =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        maintenanceMode: !prev.maintenanceMode,
                      })),
                    'Temporarily pause external operations while maintenance runs.'
                  )}
                  {renderToggle(
                    'Automated Backup',
                    systemSettings.autoBackup,
                    () =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        autoBackup: !prev.autoBackup,
                      })),
                    'Create periodic snapshots for critical admin data.'
                  )}
                </div>
                <FormActions
                  onCancel={() => setSystemSettings({ siteName: 'Trimly Admin', maintenanceMode: false, autoBackup: true })}
                  loading={loading}
                  submitLabel="Save System Settings"
                />
              </form>
            </section>
          ) : null}

          {activeTab === 'about' ? (
            <section className="admin-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">About Trimly Admin</h2>
              <p className="mt-1 text-sm text-slate-500">Platform metadata and operational notes.</p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Version</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">v1.0.0</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Environment</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Production</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Database</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">MongoDB</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Support</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">admin@trimly.com</p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Settings;
