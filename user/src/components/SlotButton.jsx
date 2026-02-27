import React from 'react'

// Button representing a selectable time slot. When `selected` is true the
// primary highlight styles are applied so the user can see the chosen slot.
export default function SlotButton({time, selected, onClick}){
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`px-3 py-2 rounded-xl border w-full sm:w-auto text-sm font-medium ${selected ? 'bg-primary text-black border-primary' : 'bg-white text-gray-800 border-transparent'} hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/40`}
    >
      {time}
    </button>
  )
}
