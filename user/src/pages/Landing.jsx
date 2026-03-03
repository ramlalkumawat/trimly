import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeSticker } from '../components/illustrations/SalonIllustrations';

const featuredServices = [
  {
    title: "Men's Haircut",
    description: 'Clean cut, fade, and finishing at your doorstep.',
    image: 'https://images.pexels.com/photos/1319461/pexels-photo-1319461.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    title: 'Beard Styling',
    description: 'Sharp beard lines and grooming with premium tools.',
    image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    title: 'Facial and Cleanup',
    description: 'Glow-focused skincare treatment for healthier skin.',
    image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    title: 'Hair Spa',
    description: 'Deep conditioning and scalp rejuvenation session.',
    image: 'https://images.pexels.com/photos/853427/pexels-photo-853427.jpeg?auto=compress&cs=tinysrgb&w=1200'
  }
];

const trustStats = [
  { label: 'Avg. Rating', value: '4.8/5' },
  { label: 'Bookings Done', value: '10K+' },
  { label: 'Verified Pros', value: '500+' }
];

const featuredCardStyles = [
  'from-[#fffaf0] via-[#fff5e4] to-[#ffe9cf] border-amber-100',
  'from-[#fff7f1] via-[#fff2eb] to-[#ffe5da] border-orange-100',
  'from-[#f8fff7] via-[#f2fff0] to-[#e6f8df] border-lime-100',
  'from-[#f4fbff] via-[#eef8ff] to-[#dff1ff] border-sky-100'
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="space-y-16 sm:space-y-20 section-fade">
      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-yellow-50 via-white to-amber-50">
        <div className="absolute -top-16 -left-10 w-52 h-52 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute -bottom-16 -right-12 w-56 h-56 rounded-full bg-orange-300/20 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-8 px-5 sm:px-8 lg:px-10 py-8 sm:py-10 items-center">
          <div>
            <span className="inline-flex text-[11px] tracking-wide uppercase px-3 py-1 rounded-full bg-gray-900 text-white">
              Salon Services at Home
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[var(--text-primary)]">
              Book Professional Salon Services At Home in
              <span className="text-yellow-600"> 30 Minutes</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-xl">
              Simple booking, hygienic tools, and trained professionals for premium grooming and beauty care at your convenience.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button onClick={() => nav('/services')} className="btn-primary px-7 py-3 rounded-2xl font-semibold text-black">
                Book Your Services
              </button>
              <button
                onClick={() => nav('/services')}
                className="px-7 py-3 rounded-2xl border border-gray-200 bg-white text-gray-800 font-medium hover:bg-gray-50 transition-colors"
              >
                Explore Packages
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8 max-w-md">
              {trustStats.map((item) => (
                <div key={item.label} className="rounded-xl bg-gradient-to-br from-white to-amber-50/60 border border-amber-100/80 p-3 shadow-soft">
                  <div className="text-base sm:text-lg font-bold text-gray-900">{item.value}</div>
                  <div className="text-[11px] sm:text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="col-span-2 rounded-2xl overflow-hidden shadow-soft h-52 sm:h-64">
              <img
                src="https://images.pexels.com/photos/7697394/pexels-photo-7697394.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Salon professional doing hair styling"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-soft h-36 sm:h-40 bg-white">
              <img
                src="https://images.pexels.com/photos/3993133/pexels-photo-3993133.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Facial treatment service"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="rounded-2xl shadow-soft h-36 sm:h-40 bg-white p-2">
              <HomeSticker />
            </div>
          </div>
        </div>
      </section>

      <section className="section-fade">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Most Booked Services</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Choose from top-rated salon services curated for home comfort.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {featuredServices.map((service, idx) => (
            <article
              key={service.title}
              className={`bg-gradient-to-br ${featuredCardStyles[idx % featuredCardStyles.length]} rounded-2xl overflow-hidden shadow-soft card-hover`}
            >
              <div className="h-44 overflow-hidden border-b border-white/60">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900">{service.title}</h3>
                <p className="mt-1 text-sm text-gray-700">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-[#101418] px-5 sm:px-8 py-8 sm:py-10 text-white section-fade">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Why Customers Prefer Trimly</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-300">
              We combine speed, skill, and service quality so your experience feels premium every time.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-200">
              <li className="flex items-start gap-2"><span className="text-yellow-400">•</span><span>Background-verified service professionals.</span></li>
              <li className="flex items-start gap-2"><span className="text-yellow-400">•</span><span>Transparent pricing before checkout.</span></li>
              <li className="flex items-start gap-2"><span className="text-yellow-400">•</span><span>Flexible rescheduling from your account.</span></li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44">
              <img
                src="https://images.pexels.com/photos/3993446/pexels-photo-3993446.jpeg?auto=compress&cs=tinysrgb&w=1000"
                alt="Salon setup at home"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="rounded-2xl overflow-hidden h-36 sm:h-44">
              <img
                src="https://images.pexels.com/photos/3993322/pexels-photo-3993322.jpeg?auto=compress&cs=tinysrgb&w=1000"
                alt="Professional makeup service"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="col-span-2 rounded-2xl bg-white/10 border border-white/10 p-5">
              <p className="text-sm text-gray-200">
                Ready for your next grooming session? Browse services, choose your slot, and confirm in under a minute.
              </p>
              <button
                onClick={() => nav('/services')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition-colors"
              >
                Browse Services
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
