import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, Plus, RefreshCw, Trash2, Wrench, X } from 'lucide-react';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import useDelayedLoading from '../hooks/useDelayedLoading';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState, InlineLoader, Skeleton } from '../components/ui/Loader';

const initialFormState = {
  name: '',
  category: '',
  price: '',
  duration: '',
  description: '',
};

const Services = () => {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const showLoader = useDelayedLoading(loading, 300);

  const fetchServices = useCallback(
    async ({ background = false } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const response = await providerAPI.getServices();
        setServices(Array.isArray(response?.data?.data) ? response.data.data : []);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to fetch services.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const modalTitle = useMemo(() => (editingService ? 'Edit Service' : 'Add Service'), [editingService]);

  const resetModal = () => {
    setOpenModal(false);
    setEditingService(null);
    setFormState(initialFormState);
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormState(initialFormState);
    setFormErrors({});
    setOpenModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormState({
      name: service.name || '',
      category: service.category || '',
      price: service.price || '',
      duration: service.duration || '',
      description: service.description || '',
    });
    setFormErrors({});
    setOpenModal(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formState.name.trim()) nextErrors.name = 'Service name is required.';
    if (!formState.category.trim()) nextErrors.category = 'Category is required.';
    if (!formState.price || Number(formState.price) <= 0) nextErrors.price = 'Price must be greater than 0.';
    if (!formState.duration.trim()) nextErrors.duration = 'Duration is required.';
    if (!formState.description.trim()) nextErrors.description = 'Description is required.';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        ...formState,
        price: Number(formState.price),
      };

      if (editingService) {
        await providerAPI.updateService(editingService._id, payload);
        toast.success('Service updated', 'Service details were updated successfully.');
      } else {
        await providerAPI.addService(payload);
        toast.success('Service added', 'New service created successfully.');
      }

      resetModal();
      fetchServices({ background: true });
    } catch (submitError) {
      toast.error(
        'Save failed',
        submitError?.response?.data?.message || 'Unable to save service changes.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Delete this service permanently?')) return;

    try {
      await providerAPI.deleteService(serviceId);
      toast.success('Service deleted', 'Service removed from your catalog.');
      fetchServices({ background: true });
    } catch (deleteError) {
      toast.error('Delete failed', deleteError?.response?.data?.message || 'Please retry.');
    }
  };

  if (showLoader) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <CardSkeleton key={idx} rows={4} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !services.length) {
    return <ErrorState title="Unable to load services" message={error} onRetry={() => fetchServices()} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Service Catalog</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Manage offered services, pricing, and descriptions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {refreshing ? <InlineLoader label="Refreshing..." /> : null}
          <button
            type="button"
            onClick={() => fetchServices({ background: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </section>

      {error ? <ErrorState compact title="Sync issue" message={error} onRetry={() => fetchServices()} /> : null}

      {services.length ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card
              key={service._id}
              hover
              bodyClassName="space-y-4"
              title={service.name}
              description={service.category}
              action={<Badge variant="info">{service.duration}</Badge>}
            >
              <div className="space-y-2 text-sm text-zinc-600">
                <p className="inline-flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-zinc-400" />
                  {service.category}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-zinc-400" />
                  {service.duration}
                </p>
                <p className="font-semibold text-zinc-900">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(Number(service.price) || 0)}
                </p>
              </div>
              <p className="line-clamp-2 text-sm text-zinc-600">{service.description}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(service)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteService(service._id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-colors duration-300 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No services yet"
          message="Create your first service to start receiving bookings."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
            >
              Add Service
            </button>
          }
        />
      )}

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/60 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-zinc-900">{modalTitle}</h3>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-xl border border-zinc-200 p-2 text-zinc-500 transition-colors duration-300 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="name">
                    Service Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-zinc-900"
                  />
                  {formErrors.name ? <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="category">
                    Category
                  </label>
                  <input
                    id="category"
                    name="category"
                    value={formState.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-zinc-900"
                  />
                  {formErrors.category ? (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.category}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="price">
                    Price (INR)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-zinc-900"
                  />
                  {formErrors.price ? <p className="mt-1 text-xs text-rose-600">{formErrors.price}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="duration">
                    Duration
                  </label>
                  <input
                    id="duration"
                    name="duration"
                    value={formState.duration}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-zinc-900"
                  />
                  {formErrors.duration ? (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.duration}</p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formState.description}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-zinc-900"
                  />
                  {formErrors.description ? (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800 disabled:opacity-70"
                >
                  {submitting ? <InlineLoader label="Saving" /> : editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Services;
