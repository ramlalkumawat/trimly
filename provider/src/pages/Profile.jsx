import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import useDelayedLoading from '../hooks/useDelayedLoading';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { ErrorState, InlineLoader, PageLoader } from '../components/ui/Loader';

const initialProfileForm = {
  name: '',
  email: '',
  phone: '',
  serviceArea: '',
  description: '',
};

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const Profile = () => {
  const { provider, updateProfile, toggleAvailability } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const showLoader = useDelayedLoading(!provider, 250);

  useEffect(() => {
    if (!provider) return;
    setProfileForm({
      name: provider.name || '',
      email: provider.email || '',
      phone: provider.phone || '',
      serviceArea: provider.serviceArea || provider.address?.city || '',
      description: provider.description || '',
    });
    setImagePreview(provider.profileImage || '');
  }, [provider]);

  const hasPasswordInput = useMemo(
    () =>
      Boolean(
        passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword
      ),
    [passwordForm]
  );

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImagePick = () => {
    if (!editing) return;
    fileInputRef.current?.click();
  };

  const handleImagePreview = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', 'Please select a valid image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result || '');
      setImagePreview(imageData);
      toast.info('Preview updated', 'Profile image preview is ready.');
    };
    reader.readAsDataURL(file);
  };

  const validate = useCallback(() => {
    const nextErrors = {};

    if (!profileForm.name.trim()) nextErrors.name = 'Name is required.';
    if (profileForm.email.trim() && !/\S+@\S+\.\S+/.test(profileForm.email)) {
      nextErrors.email = 'Enter a valid email.';
    }

    if (!profileForm.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[\d\s\-()]{8,}$/.test(profileForm.phone)) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (!profileForm.serviceArea.trim()) {
      nextErrors.serviceArea = 'Service area is required.';
    }

    if (hasPasswordInput) {
      if (!passwordForm.currentPassword) {
        nextErrors.currentPassword = 'Current password is required.';
      }
      if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
        nextErrors.newPassword = 'New password must be at least 8 characters.';
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }, [hasPasswordInput, passwordForm, profileForm]);

  const resetEditing = () => {
    if (!provider) return;
    setEditing(false);
    setErrors({});
    setPasswordForm(initialPasswordForm);
    setProfileForm({
      name: provider.name || '',
      email: provider.email || '',
      phone: provider.phone || '',
      serviceArea: provider.serviceArea || provider.address?.city || '',
      description: provider.description || '',
    });
    setImagePreview(provider.profileImage || '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        serviceArea: profileForm.serviceArea.trim(),
        description: profileForm.description.trim(),
      };

      if (hasPasswordInput) {
        payload.currentPassword = passwordForm.currentPassword;
        payload.newPassword = passwordForm.newPassword;
      }

      if (imagePreview && imagePreview !== provider?.profileImage) {
        payload.profileImage = imagePreview;
      }

      const response = await providerAPI.updateProfile(payload);
      updateProfile(response?.data?.data || payload);
      toast.success('Profile updated', 'Your profile changes have been saved.');
      setPasswordForm(initialPasswordForm);
      setEditing(false);
    } catch (submitError) {
      toast.error(
        'Update failed',
        submitError?.response?.data?.message || 'Unable to save profile right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setTogglingAvailability(true);
      const next = !provider?.isAvailable;
      const result = await toggleAvailability(next);
      if (result.success) {
        toast.success('Status updated', `You are now ${next ? 'online' : 'offline'}.`);
      } else {
        toast.error('Update failed', result.error || 'Could not update status.');
      }
    } finally {
      setTogglingAvailability(false);
    }
  };

  if (showLoader) return <PageLoader label="Loading profile..." />;

  if (!provider) {
    return (
      <ErrorState
        title="Profile unavailable"
        message="Provider details could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Profile Settings</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Manage personal information, security, and service availability.
          </p>
        </div>
        <Badge variant={provider.isAvailable ? 'success' : 'default'}>
          {provider.isAvailable ? 'Online' : 'Offline'}
        </Badge>
      </section>

      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <Card title="Profile Image" description="Upload a profile image for your account">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  <UserRound className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-zinc-700">Recommended: Square image, max 5MB</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePreview}
                />
                <button
                  type="button"
                  onClick={handleImagePick}
                  disabled={!editing}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImagePreview(provider.profileImage || '')}
                  disabled={!editing}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Personal Details" description="Basic account and contact information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  disabled={!editing}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-900 disabled:bg-zinc-100"
                />
              </div>
              {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-100 py-2.5 pl-10 pr-3 text-sm text-zinc-500"
                />
              </div>
              {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="phone">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  disabled={!editing}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-900 disabled:bg-zinc-100"
                />
              </div>
              {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="serviceArea">
                Service Area
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  id="serviceArea"
                  name="serviceArea"
                  type="text"
                  value={profileForm.serviceArea}
                  onChange={handleProfileChange}
                  disabled={!editing}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-900 disabled:bg-zinc-100"
                />
              </div>
              {errors.serviceArea ? (
                <p className="mt-1 text-xs text-rose-600">{errors.serviceArea}</p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="description">
                Business Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={profileForm.description}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-zinc-900 disabled:bg-zinc-100"
              />
            </div>
          </div>
        </Card>

        <Card
          title="Security"
          description="Change password to keep your account secure"
          action={
            <Badge variant={hasPasswordInput ? 'warning' : 'default'}>
              {hasPasswordInput ? 'Unsaved changes' : 'No pending changes'}
            </Badge>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm Password' },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor={field.key}>
                  {field.label}
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    id={field.key}
                    name={field.key}
                    type={showPassword[field.key] ? 'text' : 'password'}
                    value={passwordForm[field.key]}
                    onChange={handlePasswordChange}
                    disabled={!editing}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-800 outline-none transition focus:border-zinc-900 disabled:bg-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                    }
                    disabled={!editing}
                    className="absolute right-3 top-2.5 text-zinc-400 transition-colors duration-300 hover:text-zinc-700 disabled:opacity-60"
                  >
                    {showPassword[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors[field.key] ? (
                  <p className="mt-1 text-xs text-rose-600">{errors[field.key]}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Availability" description="Control whether you receive new booking requests">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-zinc-600" />
              <p className="text-sm text-zinc-600">
                {provider.isAvailable
                  ? 'You are currently online and receiving requests.'
                  : 'You are currently offline and hidden from new requests.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAvailability}
              disabled={togglingAvailability}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {togglingAvailability ? (
                <InlineLoader label="Updating" />
              ) : provider.isAvailable ? (
                'Go Offline'
              ) : (
                'Go Online'
              )}
            </button>
          </div>
        </Card>

        <section className="flex flex-wrap justify-end gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={resetEditing}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <InlineLoader label="Saving" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
            >
              Edit Profile
            </button>
          )}
        </section>
      </form>
    </div>
  );
};

export default Profile;
