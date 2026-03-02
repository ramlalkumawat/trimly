import React from 'react'

// Small input wrapper to enforce consistent input styling across the app.
// Spreads `props` so it supports `value`, `onChange`, `placeholder`, `className`, etc.
export default function Input({ error = false, className = '', ...props }){
  const stateClasses = error
    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
    : 'border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100';

  return (
    <input
      {...props}
      className={`input-default w-full border rounded-xl px-4 py-3 outline-none placeholder-gray-400 transition-all duration-200 focus-ring ${stateClasses} ${className}`}
    />
  )
}
