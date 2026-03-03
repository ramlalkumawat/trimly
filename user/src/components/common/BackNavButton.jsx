import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackNavButton({ fallback = '/services', label = 'Back' }) {
  const nav = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      nav(-1);
      return;
    }
    nav(fallback, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
