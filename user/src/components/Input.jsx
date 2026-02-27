import React from 'react'

// Small input wrapper to enforce consistent input styling across the app.
// Spreads `props` so it supports `value`, `onChange`, `placeholder`, `className`, etc.
export default function Input({...props}){
  return (
    <input
      {...props}
      className={`input-default border rounded-xl px-4 py-3 outline-none placeholder-gray-400 ${props.className || ''}`}
    />
  )
}
