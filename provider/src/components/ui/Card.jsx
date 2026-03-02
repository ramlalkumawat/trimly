import React, { memo } from 'react';

const baseCardClass =
  'rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300';

// Reusable card surface used across pages for consistent spacing and structure.
const Card = memo(function Card({
  title,
  description,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  hover = false,
}) {
  return (
    <section
      className={[
        baseCardClass,
        hover ? 'hover:-translate-y-0.5 hover:shadow-md' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(title || description || action) && (
        <header
          className={[
            'flex items-start justify-between gap-4 border-b border-zinc-100 px-4 py-4 sm:px-6',
            headerClassName,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-sm font-semibold text-zinc-900 sm:text-base">{title}</h2>
            ) : null}
            {description ? <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}
      <div className={['px-4 py-4 sm:px-6 sm:py-5', bodyClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </section>
  );
});

export default Card;
