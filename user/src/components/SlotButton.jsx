import React from 'react'

// Button representing a selectable time slot. When `selected` is true the
// primary highlight styles are applied so the user can see the chosen slot.
export default function SlotButton({time, subtitle, selected, disabled = false, onClick}){
  const stateClass = selected
    ? 'border-indigo-600 bg-indigo-600 text-white shadow-[0_16px_30px_-22px_rgba(67,56,202,0.9)]'
    : disabled
      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
      : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      disabled={disabled}
      className={`w-full rounded-2xl border px-3 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${stateClass}`}
    >
      <div className="text-sm font-semibold">{time}</div>
      {subtitle && <div className={`text-[11px] mt-0.5 ${selected ? 'text-indigo-100' : 'text-slate-500'}`}>{subtitle}</div>}
    </button>
  )
}
