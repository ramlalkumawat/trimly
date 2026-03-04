import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  CirclePlay,
  Clock3,
  MapPin,
  Phone,
  RefreshCw,
  X,
} from 'lucide-react';
import { providerAPI } from '../api/provider';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import useDelayedLoading from '../hooks/useDelayedLoading';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { CardSkeleton, EmptyState, ErrorState, InlineLoader, Skeleton } from '../components/ui/Loader';

// Backward compatibility map for older URL query param names.
const LEGACY_STATUS_TO_FILTER = {
  pending: 'pending',
  completed: 'completed',
  accepted: 'all',
  in_progress: 'all',
};

// Tabs available on bookings screen.
const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

// Standard currency formatter for booking totals.
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// Safely formats booking date strings from API.
const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString();
};

// Provider bookings management screen (pending, active, completed workflows).
const Bookings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { provider } = useAuth();

  const legacyStatus = searchParams.get('status');
  const filterFromQuery = searchParams.get('filter');
  const activeFilter = filterFromQuery || LEGACY_STATUS_TO_FILTER[legacyStatus] || 'all';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [highlightId, setHighlightId] = useState('');
  const firstBookingRef = useRef(null);
  const previousCountRef = useRef(0);

  const showLoading = useDelayedLoading(loading, 300);

  // Loads bookings list according to currently active tab filter.
  const fetchBookings = useCallback(
    async ({ background = false } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const requestStatus =
          activeFilter === 'all' ? undefined : activeFilter === 'pending' ? 'pending' : 'completed';
        const response = await providerAPI.getBookings(requestStatus, background ? { headers: { 'x-skip-global-loader': 'true' } } : {});
        const list = Array.isArray(response?.data?.data?.bookings) ? response.data.data.bookings : [];
        setBookings(list);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to load bookings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-scrolls to newest booking when list grows.
  useEffect(() => {
    if (bookings.length > previousCountRef.current && firstBookingRef.current) {
      firstBookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightId(bookings[0]?._id || '');
      window.setTimeout(() => setHighlightId(''), 1600);
    }
    previousCountRef.current = bookings.length;
  }, [bookings]);

  // Generic wrapper for accept/reject/start/complete actions.
  const updateBookingAction = useCallback(
    async (bookingId, actionType, apiCall, successTitle, successMessage) => {
      try {
        setActionLoading((prev) => ({ ...prev, [bookingId]: actionType }));
        await apiCall(bookingId);
        toast.success(successTitle, successMessage);
        fetchBookings({ background: true });
      } catch (actionError) {
        toast.error('Action failed', actionError?.response?.data?.message || 'Please retry.');
      } finally {
        setActionLoading((prev) => ({ ...prev, [bookingId]: null }));
      }
    },
    [fetchBookings, toast]
  );

  const filteredBookings = useMemo(() => {
    if (activeFilter === 'all') return bookings;
    return bookings.filter((booking) => booking.status === activeFilter);
  }, [activeFilter, bookings]);

  const headingText = useMemo(() => {
    if (activeFilter === 'pending') return 'Pending Bookings';
    if (activeFilter === 'completed') return 'Completed Bookings';
    return 'All Bookings';
  }, [activeFilter]);

  const handleTabChange = (tabKey) => {
    navigate(`/bookings?filter=${tabKey}`);
  };

  if (showLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-200 bg-white p-2 sm:max-w-md">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} rows={6} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !bookings.length) {
    return (
      <ErrorState title="Could not load bookings" message={error} onRetry={() => fetchBookings()} />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">{headingText}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Review requests, run in-progress jobs, and track completed work.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing ? <InlineLoader label="Refreshing..." /> : null}
          <button
            type="button"
            onClick={() => fetchBookings({ background: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {!provider?.isAvailable ? (
        <ErrorState
          compact
          title="You are offline"
          message="Turn on availability from the sidebar to receive new booking requests."
        />
      ) : null}

      <section className="w-full overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-2xl border border-zinc-200 bg-white p-2 sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300',
                activeFilter === tab.key
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <ErrorState compact title="Sync issue" message={error} onRetry={() => fetchBookings()} />
      ) : null}

      {filteredBookings.length ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredBookings.map((booking, index) => {
            const isLoadingAction = actionLoading[booking._id];

            return (
              <Card
                key={booking._id}
                className={highlightId === booking._id ? 'ring-2 ring-zinc-300' : ''}
                bodyClassName="space-y-4"
              >
                <div
                  ref={index === 0 ? firstBookingRef : null}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-zinc-900">
                      {booking.customerId?.name || 'Customer'}
                    </p>
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {booking.serviceId?.name || 'Service'} • {formatCurrency(booking.totalAmount || booking.serviceId?.price || 0)}
                    </p>
                  </div>
                  <Badge variant={booking.status}>{String(booking.status || 'pending').replace('_', ' ')}</Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm text-zinc-600 sm:grid-cols-2">
                  <p className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-zinc-400" />
                    {formatDate(booking.date)} {booking.time ? `• ${booking.time}` : ''}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    {booking.customerId?.phone || booking.customerId?.email || 'No contact'}
                  </p>
                  <p className="sm:col-span-2 inline-flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-zinc-400" />
                    <span className="break-words">{booking.address || 'Address not provided'}</span>
                  </p>
                </div>

                {booking.notes ? (
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-600">
                    <span className="font-medium text-zinc-700">Notes:</span> {booking.notes}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {booking.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          updateBookingAction(
                            booking._id,
                            'accept',
                            providerAPI.acceptBooking,
                            'Booking accepted',
                            'Booking request accepted successfully.'
                          )
                        }
                        disabled={isLoadingAction === 'accept'}
                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800 disabled:opacity-70"
                      >
                        {isLoadingAction === 'accept' ? <InlineLoader label="Accepting" /> : <><Check className="h-4 w-4" />Accept</>}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateBookingAction(
                            booking._id,
                            'reject',
                            providerAPI.rejectBooking,
                            'Booking rejected',
                            'Booking request rejected.'
                          )
                        }
                        disabled={isLoadingAction === 'reject'}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 disabled:opacity-70"
                      >
                        {isLoadingAction === 'reject' ? <InlineLoader label="Rejecting" /> : <><X className="h-4 w-4" />Reject</>}
                      </button>
                    </>
                  ) : null}

                  {booking.status === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateBookingAction(
                          booking._id,
                          'start',
                          providerAPI.startService,
                          'Service started',
                          'Service marked as in-progress.'
                        )
                      }
                      disabled={isLoadingAction === 'start'}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800 disabled:opacity-70"
                    >
                      {isLoadingAction === 'start' ? <InlineLoader label="Starting" /> : <><CirclePlay className="h-4 w-4" />Start Service</>}
                    </button>
                  ) : null}

                  {booking.status === 'in_progress' ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateBookingAction(
                          booking._id,
                          'complete',
                          providerAPI.completeService,
                          'Service completed',
                          'Great work. Booking moved to completed.'
                        )
                      }
                      disabled={isLoadingAction === 'complete'}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800 disabled:opacity-70"
                    >
                      {isLoadingAction === 'complete' ? <InlineLoader label="Completing" /> : <><Check className="h-4 w-4" />Mark Completed</>}
                    </button>
                  ) : null}

                </div>
              </Card>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title={`No ${activeFilter} bookings`}
          message="When new bookings arrive, they will appear here automatically."
          action={
            <button
              type="button"
              onClick={() => fetchBookings({ background: true })}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
            >
              Refresh List
            </button>
          }
        />
      )}
    </div>
  );
};

export default Bookings;
