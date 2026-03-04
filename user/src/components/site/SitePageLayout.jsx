import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { fieldDefinitions } from '../../data/sitePages';
import api from '../../utils/api';

// Shared template for informational site pages (company/customers/professionals/follow).
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s()-]{8,20}$/;

// Creates empty form object based on current page's configured form fields.
function buildInitialValues(fields) {
  return fields.reduce((acc, fieldKey) => {
    acc[fieldKey] = '';
    return acc;
  }, {});
}

// Renders CTA as internal route link or external anchor depending on config.
function ActionButton({ action, className, children }) {
  if (!action?.to) {
    return null;
  }

  if (action.external) {
    return (
      <a href={action.to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={action.to} className={className}>
      {children}
    </Link>
  );
}

// Decorative hero SVG used by all site pages for visual consistency.
function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 280" className="w-full h-full" role="img" aria-label="Trimly platform illustration">
      <defs>
        <linearGradient id="trimlyHeroCard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="trimlyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="420" height="280" rx="28" fill="#eef2ff" />
      <circle cx="74" cy="64" r="36" fill="#c7d2fe" />
      <circle cx="350" cy="216" r="32" fill="#a7f3d0" />
      <rect x="74" y="50" width="272" height="180" rx="20" fill="url(#trimlyHeroCard)" />
      <rect x="96" y="78" width="112" height="16" rx="8" fill="#e0e7ff" />
      <rect x="96" y="106" width="220" height="12" rx="6" fill="#a5b4fc" />
      <rect x="96" y="126" width="164" height="12" rx="6" fill="#a5b4fc" />
      <rect x="96" y="158" width="250" height="48" rx="14" fill="#ffffff" opacity="0.94" />
      <circle cx="126" cy="182" r="15" fill="url(#trimlyGlow)" />
      <rect x="152" y="172" width="152" height="8" rx="4" fill="#334155" />
      <rect x="152" y="186" width="118" height="8" rx="4" fill="#64748b" />
    </svg>
  );
}

export default function SitePageLayout({ page, sectionKey, slug, sectionLabel, sectionIcon: SectionIcon }) {
  const [openFaq, setOpenFaq] = useState(0);
  const initialValues = useMemo(() => buildInitialValues(page.form.fields), [page.form.fields]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset local form/UI state whenever page config changes.
  useEffect(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitted(false);
    setFormMessage('');
    setSubmitError('');
    setSubmitting(false);
    setOpenFaq(0);
  }, [initialValues, page.title]);

  // Validates dynamic form fields according to per-field constraints.
  const validateForm = () => {
    const nextErrors = {};

    page.form.fields.forEach((fieldKey) => {
      const definition = fieldDefinitions[fieldKey];
      const value = String(values[fieldKey] || '').trim();
      const isOptional = fieldKey === 'bookingId';

      if (!value && !isOptional) {
        nextErrors[fieldKey] = `${definition?.label || 'This field'} is required`;
        return;
      }

      if (!value) {
        return;
      }

      if (fieldKey === 'email' && !emailRegex.test(value)) {
        nextErrors[fieldKey] = 'Enter a valid email address';
      } else if (fieldKey === 'phone' && !phoneRegex.test(value)) {
        nextErrors[fieldKey] = 'Enter a valid phone number';
      } else if (fieldKey === 'rating') {
        const numeric = Number(value);
        if (Number.isNaN(numeric) || numeric < 1 || numeric > 5) {
          nextErrors[fieldKey] = 'Rating should be between 1 and 5';
        }
      } else if (fieldKey === 'message' && value.length < 20) {
        nextErrors[fieldKey] = 'Please add at least 20 characters';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Updates one form field and clears only that field's existing error.
  const handleChange = (fieldKey, fieldValue) => {
    setValues((prev) => ({
      ...prev,
      [fieldKey]: fieldValue
    }));
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  // Submits inquiry payload to backend /site/inquiries endpoint.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(false);
    setFormMessage('');
    setSubmitError('');
    if (!validateForm()) {
      return;
    }

    const payload = {
      // Metadata helps backend identify the exact content page form source.
      section: sectionKey,
      slug,
      pageTitle: page.title,
      source: 'user-web',
      ...page.form.fields.reduce((acc, key) => {
        const raw = values[key];
        if (raw === undefined || raw === null) {
          acc[key] = '';
          return acc;
        }

        if (key === 'rating') {
          const numeric = Number(raw);
          acc[key] = Number.isNaN(numeric) ? '' : numeric;
          return acc;
        }

        acc[key] = String(raw).trim();
        return acc;
      }, {})
    };

    setSubmitting(true);
    try {
      const response = await api.post('/site/inquiries', payload);
      setSubmitted(true);
      setFormMessage(response?.data?.message || page.form.successMessage);
      setValues(initialValues);
    } catch (error) {
      setSubmitError(error.response?.data?.message || error.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 sm:space-y-14 text-slate-900 section-fade">
      <section className="relative overflow-hidden rounded-[30px] border border-indigo-100 bg-gradient-to-br from-[#e0e7ff] via-[#f8fafc] to-[#ecfeff] p-4 sm:p-7 lg:p-10">
        <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {SectionIcon && <SectionIcon className="h-3.5 w-3.5" />}
              {sectionLabel}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">{page.badge}</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">{page.title}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{page.subtitle}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <ActionButton
                action={page.ctaPanel?.primary}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                {page.ctaPanel?.primary?.label || 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </ActionButton>
              <ActionButton
                action={page.ctaPanel?.secondary}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-100/70 px-6 py-3 text-sm font-semibold text-amber-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-100"
              >
                {page.ctaPanel?.secondary?.label || 'Learn More'}
              </ActionButton>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {page.metrics.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.label}
                    className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.6)] backdrop-blur-md"
                  >
                    <div className="mb-2 inline-flex rounded-xl bg-indigo-100 p-2 text-indigo-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/70 p-3 shadow-[0_30px_50px_-35px_rgba(30,64,175,0.9)] backdrop-blur-md">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why this matters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-30px_rgba(30,64,175,0.9)]"
              >
                <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-2 text-indigo-700 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">{page.narrativeHeading}</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {page.narrative.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-6 space-y-3">
            {page.bulletPoints.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700 sm:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-slate-900">Customer voices</h3>
          <div className="mt-4 space-y-4">
            {page.testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur">
                <p className="text-sm text-slate-700">"{item.quote}"</p>
                <p className="mt-3 text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.role}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-3">
            {page.faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="overflow-hidden rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOpenFaq((prev) => (prev === index ? -1 : index))}
                    className="flex w-full items-center justify-between gap-4 bg-slate-50/80 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
                  >
                    {faq.question}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden px-4">
                      <p className="py-3 text-sm text-slate-600">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">{page.form.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{page.form.description}</p>

          {submitted && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {formMessage || page.form.successMessage}
            </div>
          )}
          {submitError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {page.form.fields.map((fieldKey) => {
              const field = fieldDefinitions[fieldKey];
              const hasError = Boolean(errors[fieldKey]);
              const commonClassName = `w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-all duration-200 ${
                hasError
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
              }`;

              return (
                <label key={fieldKey} className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {field.label}
                  </span>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={values[fieldKey] || ''}
                      onChange={(event) => handleChange(fieldKey, event.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      disabled={submitting}
                      className={`${commonClassName} resize-none`}
                    />
                  ) : (
                    <input
                      value={values[fieldKey] || ''}
                      onChange={(event) => handleChange(fieldKey, event.target.value)}
                      type={field.type}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      disabled={submitting}
                      className={commonClassName}
                    />
                  )}
                  {hasError && <span className="mt-1 block text-xs text-red-600">{errors[fieldKey]}</span>}
                </label>
              );
            })}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              {submitting ? 'Submitting...' : page.form.submitLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
