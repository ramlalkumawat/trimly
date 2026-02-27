import React from 'react';

// Reusable button with admin theme variants (primary/secondary/danger).
export default function Button({ children, variant = 'primary', ...rest }) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const styles = {
    primary: 'bg-primary text-text-primary hover:bg-primary-hover',
    secondary: 'bg-input-bg text-text-primary hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };
  return (
    <button className={`${base} ${styles[variant] || styles.primary}`} {...rest}>
      {children}
    </button>
  );
}
