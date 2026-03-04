import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarClock,
  MapPin,
  Pencil,
  Save,
  Sparkles,
  UserRound,
  X,
  XCircle
} from 'lucide-react';
import Input from '../components/Input';
import api from '../utils/api';
import useSocket from '../hooks/useSocket';
import { clearAuthSession } from '../utils/auth';

// Booking timeline steps used to visualize progress in customer booking history.
const BOOKING_STEPS = [
  { key: 'pending', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' }
];

// UI metadata map for each booking status (badge color, hint, progress step index).
const STATUS_META = {
  pending: {
    label: 'Pending',
    hint: 'Waiting for provider confirmation',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    cardClass: 'from-amber-50/70 via-white to-amber-50/40',
    step: 0
  },
  accepted: {
    label: 'Accepted',
    hint: 'Provider accepted your booking',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    cardClass: 'from-blue-50/70 via-white to-indigo-50/40',
    step: 1
  },
  in_progress: {
    label: 'In Progress',
    hint: 'Your service is currently in progress',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    cardClass: 'from-violet-50/70 via-white to-indigo-50/40',
    step: 2
  },
  completed: {
    label: 'Completed',
    hint: 'Service completed successfully',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cardClass: 'from-emerald-50/70 via-white to-teal-50/40',
    step: 3
  },
  cancelled: {
    label: 'Cancelled',
    hint: 'This booking was cancelled',
    badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
    cardClass: 'from-slate-100/70 via-white to-slate-50/50',
    step: -1
  },
  rejected: {
    label: 'Rejected',
    hint: 'Provider could not accept this booking',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    cardClass: 'from-rose-50/70 via-white to-red-50/40',
    step: -1
  }
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.pending;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s()-]{8,20}$/;

// Reads cached user safely to prevent JSON parse crashes.
const parseLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    return {};
  }
};

// Normalizes profile shape from API/localStorage so UI can rely on stable keys.
const normalizeProfile = (raw = {}) => {
  const firstName = String(raw.firstName || '').trim();
  const lastName = String(raw.lastName || '').trim();
  const composedName = `${firstName} ${lastName}`.trim();
  const name = String(raw.name || composedName || '').trim();

  return {
    firstName,
    lastName,
    name,
    email: String(raw.email || '').trim(),
    phone: String(raw.phone || '').trim(),
    locationAddress: String(raw.location?.address || '').trim(),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null
  };
};

// Formats booking schedule timestamp for cards.
const formatDateTime = (booking) => {
  const source = booking.scheduledTime || booking.date;
  const value = new Date(source);
  if (Number.isNaN(value.getTime())) {
    return 'Date not available';
  }
  return value.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(amount || 0));

// Formats join date shown in profile summary section.
const formatMemberSince = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

// Unified customer profile + booking history screen with realtime status updates.
export default function Profile() {
  const nav = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const localUser = useMemo(() => parseLocalUser(), []);

  const {
    connected,
    bookingStatus,
    bookingAccepted,
    bookingRejected,
    clearEvent,
    joinBookingRoom,
    leaveBookingRoom
  } = useSocket(token, localUser);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [profileData, setProfileData] = useState(() => normalizeProfile(localUser));
  const [profileForm, setProfileForm] = useState(() => normalizeProfile(localUser));

  const displayName = profileData.name || localUser.name || 'User';
  const displayContact = profileData.email || profileData.phone || '';

  // Keeps local cached user in sync after profile API updates.
  const syncLocalStorageUser = (rawUser = {}) => {
    const previous = parseLocalUser();
    const next = { ...previous, ...rawUser };
    localStorage.setItem('user', JSON.stringify(next));
  };

  // Applies normalized profile object to both read-only and editable states.
  const applyProfileData = (raw = {}) => {
    const normalized = normalizeProfile(raw);
    setProfileData(normalized);
    setProfileForm(normalized);
    return normalized;
  };

  // Loads current user's bookings for history and status tracking.
  const fetchBookings = async () => {
    setLoadingBookings(true);
    setBookingError('');
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Failed to fetch bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Loads profile details from backend.
  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await api.get('/user/profile');
      applyProfileData(res.data.data || {});
      syncLocalStorageUser(res.data.data || {});
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to fetch profile');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchProfile();
  }, []);

  // Optional navigation helper: scroll to top when redirected from other pages.
  useEffect(() => {
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.state]);

  // Join/leave socket rooms for each booking so updates are scoped to relevant records.
  useEffect(() => {
    bookings.forEach((booking) => joinBookingRoom(booking._id));
    return () => {
      bookings.forEach((booking) => leaveBookingRoom(booking._id));
    };
  }, [bookings, joinBookingRoom, leaveBookingRoom]);

  // Applies realtime socket payload into local booking list.
  const updateBookingFromSocket = (payload, defaultNotice = 'Booking updated') => {
    if (!payload?.booking?._id) return;
    setBookings((prev) =>
      prev.map((item) => (item._id === payload.booking._id ? { ...item, ...payload.booking } : item))
    );
    setBookingNotice(payload.message || defaultNotice);

    if (payload.booking.status === 'completed') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (bookingStatus) {
      updateBookingFromSocket(bookingStatus);
      clearEvent('bookingStatus');
    }
  }, [bookingStatus, clearEvent]);

  useEffect(() => {
    if (bookingAccepted) {
      updateBookingFromSocket(bookingAccepted, 'Your booking was accepted');
      clearEvent('bookingAccepted');
    }
  }, [bookingAccepted, clearEvent]);

  useEffect(() => {
    if (bookingRejected) {
      updateBookingFromSocket(bookingRejected, 'Your booking was rejected');
      clearEvent('bookingRejected');
    }
  }, [bookingRejected, clearEvent]);

  // Allows customer to cancel only cancellable bookings.
  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    setBookingError('');
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, {
        status: 'cancelled',
        reason: 'Cancelled by customer'
      });
      const updated = res.data.data;
      setBookings((prev) => prev.map((item) => (item._id === bookingId ? updated : item)));
      setBookingNotice('Booking cancelled');
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId('');
    }
  };

  // Validates editable profile fields before PUT /user/profile.
  const validateProfile = () => {
    const nextErrors = {};
    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const email = profileForm.email.trim();
    const phone = profileForm.phone.trim();
    const fullName = `${firstName} ${lastName}`.trim();

    if (!fullName) {
      nextErrors.firstName = 'First or last name is required';
    }

    if (!phone) {
      nextErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone)) {
      nextErrors.phone = 'Enter a valid phone number';
    }

    if (email && !emailRegex.test(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Updates one form field and clears that field's validation error.
  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Persists profile updates and refreshes local cache/state.
  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileNotice('');

    if (!validateProfile()) {
      return;
    }

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const name = `${firstName} ${lastName}`.trim();

    setProfileSaving(true);
    try {
      const payload = {
        firstName,
        lastName,
        name,
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim()
      };

      const res = await api.put('/user/profile', payload);
      applyProfileData(res.data.data || {});
      syncLocalStorageUser(res.data.data || {});
      setIsEditingProfile(false);
      setProfileNotice('Profile updated successfully');
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Opens edit mode and clears stale alerts/errors.
  const startEditProfile = () => {
    setIsEditingProfile(true);
    setProfileError('');
    setProfileNotice('');
    setFieldErrors({});
  };

  // Resets edit form back to last saved profile values.
  const cancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileForm(profileData);
    setFieldErrors({});
    setProfileError('');
  };

  // Local logout for customer app.
  const handleLogout = () => {
    clearAuthSession();
    nav('/login', { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 section-fade">
      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Profile Dashboard
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{displayName}</h1>
            <p className="text-sm text-slate-600">{displayContact}</p>
            <p className="mt-2 text-xs text-slate-500">
              Live status:{' '}
              <span className={`font-semibold ${connected ? 'text-emerald-700' : 'text-amber-700'}`}>
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Profile Information</h2>
            <p className="text-sm text-slate-600">Manage your account details and contact information.</p>
          </div>

          {!isEditingProfile ? (
            <button
              type="button"
              onClick={startEditProfile}
              disabled={profileLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          ) : null}
        </div>

        {profileNotice && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {profileNotice}
          </div>
        )}
        {profileError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {profileError}
          </div>
        )}

        {profileLoading ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  First Name
                </label>
                <Input
                  value={profileForm.firstName}
                  onChange={(event) => handleProfileChange('firstName', event.target.value)}
                  placeholder="Enter first name"
                  error={Boolean(fieldErrors.firstName)}
                  disabled={!isEditingProfile || profileSaving}
                />
                {fieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Last Name
                </label>
                <Input
                  value={profileForm.lastName}
                  onChange={(event) => handleProfileChange('lastName', event.target.value)}
                  placeholder="Enter last name"
                  disabled={!isEditingProfile || profileSaving}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Email
                </label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => handleProfileChange('email', event.target.value)}
                  placeholder="Enter email"
                  error={Boolean(fieldErrors.email)}
                  disabled={!isEditingProfile || profileSaving}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Phone
                </label>
                <Input
                  value={profileForm.phone}
                  onChange={(event) => handleProfileChange('phone', event.target.value)}
                  placeholder="Enter phone number"
                  error={Boolean(fieldErrors.phone)}
                  disabled={!isEditingProfile || profileSaving}
                />
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <span className="text-xs uppercase tracking-[0.1em] text-slate-500">Primary Address</span>
                <p className="mt-1">{profileData.locationAddress || 'Not available'}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.1em] text-slate-500">Member Since</span>
                <p className="mt-1">{formatMemberSince(profileData.createdAt)}</p>
              </div>
            </div>

            {isEditingProfile && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={cancelEditProfile}
                  disabled={profileSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        )}
      </section>

      {bookingNotice && (
        <div className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2 border border-green-200">
          {bookingNotice}
        </div>
      )}
      {bookingError && (
        <div className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2 border border-red-200">
          {bookingError}
        </div>
      )}

      <section>
        <h2 className="font-semibold mb-3 text-slate-900">Booking History</h2>
        {loadingBookings ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-600 shadow-soft">
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-600 shadow-soft">
            No bookings yet
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const canCancel = ['pending', 'accepted'].includes(booking.status);
              const statusMeta = getStatusMeta(booking.status);
              const showProgress = statusMeta.step >= 0;

              return (
                <article
                  key={booking._id}
                  className={`rounded-3xl border border-slate-100 bg-gradient-to-br ${statusMeta.cardClass} p-4 shadow-soft sm:p-5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{booking.serviceId?.name || 'Service'}</h3>
                      <p className="mt-1 text-xs text-slate-500 font-mono">#{booking._id?.slice(-8) || 'N/A'}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>{formatDateTime(booking)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>{booking.address || 'Address not available'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{formatCurrency(booking.totalAmount || 0)}</span>
                    </div>
                    {booking.providerId && (
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                        <span>{booking.providerId.businessName || booking.providerId.name || 'Assigned provider'}</span>
                      </div>
                    )}
                  </div>

                  {showProgress ? (
                    <div className="mt-4 rounded-2xl border border-white/90 bg-white/80 p-3">
                      <p className="text-xs font-medium text-slate-600">{statusMeta.hint}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {BOOKING_STEPS.map((step, idx) => {
                          const done = statusMeta.step >= idx;
                          const active = statusMeta.step === idx;
                          return (
                            <div key={`${booking._id}-${step.key}`} className="rounded-xl border border-slate-100 bg-white px-2.5 py-2 text-center">
                              <div
                                className={`mx-auto mb-1 h-6 w-6 rounded-full text-[11px] font-bold leading-6 ${
                                  done
                                    ? active
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <p className={`text-[11px] font-medium ${done ? 'text-slate-800' : 'text-slate-500'}`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-rose-800">
                        <XCircle className="h-4 w-4" />
                        {statusMeta.hint}
                      </p>
                      {booking.rejectionReason && (
                        <p className="mt-2 text-xs text-rose-700">Reason: {booking.rejectionReason}</p>
                      )}
                    </div>
                  )}

                  {booking.status === 'completed' && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      Service completed. Thank you for booking with Trimly.
                    </div>
                  )}

                  {canCancel && (
                    <div className="pt-4">
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
