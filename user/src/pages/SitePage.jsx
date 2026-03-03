import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import SitePageLayout from '../components/site/SitePageLayout';
import { resolveSitePage, sectionMeta } from '../data/sitePages';

export default function SitePage({ section }) {
  const { slug } = useParams();
  const page = resolveSitePage(section, slug);
  const metadata = sectionMeta[section];

  useEffect(() => {
    if (page?.seoTitle) {
      document.title = page.seoTitle;
      return;
    }
    document.title = 'Trimly';
  }, [page]);

  if (!page || !metadata) {
    return (
      <section className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-3 text-sm text-slate-600">
          The page you are looking for is unavailable or the link is outdated.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Go To Home
        </Link>
      </section>
    );
  }

  return (
    <SitePageLayout
      page={page}
      sectionKey={section}
      slug={slug}
      sectionLabel={metadata.title}
      sectionIcon={metadata.icon}
    />
  );
}
