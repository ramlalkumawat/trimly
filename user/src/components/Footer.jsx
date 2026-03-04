import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin, UsersRound, Youtube } from 'lucide-react';
import { footerSections, socialProfiles } from '../data/sitePages';

// Icon links rendered for the "Follow" footer section.
const socialLinks = [
  { icon: Instagram, href: socialProfiles.instagram.href, label: 'Instagram' },
  { icon: Youtube, href: socialProfiles.youtube.href, label: 'YouTube' },
  { icon: Linkedin, href: socialProfiles.linkedin.href, label: 'LinkedIn' },
  { icon: UsersRound, href: socialProfiles.community.href, label: 'Community' }
];

// Shared footer used on every user-app route with quick links and social handles.
export default function Footer() {
  return (
    <footer className="relative mt-12 overflow-hidden bg-[#0b1225] text-slate-200">
      <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerSections.map((section) => (
            <section key={section.key}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-indigo-200">{section.title}</h3>
              {section.key === 'follow' ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {socialLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={item.label}
                        aria-label={item.label}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/50 hover:text-emerald-300"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <Link className="text-slate-300 transition-colors duration-200 hover:text-emerald-300" to={item.path}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} Trimly. All rights reserved.</p>
          <p className="mt-1">
            Designed &amp; Developed by{' '}
            <a
              href={socialProfiles.linkedin.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-300 transition-colors hover:text-amber-200"
            >
              Ramlal Kumawat
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
