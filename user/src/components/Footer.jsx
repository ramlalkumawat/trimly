import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-slate-300 mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <section>
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>About Trimly</li>
              <li>Careers</li>
              <li>Terms and Conditions</li>
              <li>Privacy Policy</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-3">For Customers</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Contact Us</li>
              <li>Service Areas</li>
              <li>FAQs</li>
              <li>Reviews</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-3">For Professionals</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Join as a Stylist</li>
              <li>Partner With Us</li>
              <li>Training Support</li>
              <li>Business Growth</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-3">Follow Us</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Instagram</li>
              <li>YouTube</li>
              <li>LinkedIn</li>
              <li>Community</li>
            </ul>
          </section>
        </div>

        <div className="border-t border-slate-700 mt-10 pt-6 text-center space-y-1">
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Trimly. All rights reserved.</p>
          <p className="text-xs text-slate-500">
            Designed &amp; Developed by{' '}
            <a
              href="https://www.instagram.com/_ramlal__kumawat/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-block font-semibold tracking-wide transition-transform duration-300 hover:scale-[1.03]"
            >
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Ramlal Kumawat
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 group-hover:w-full"
              />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
