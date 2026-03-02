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
          <p className="text-xs text-slate-500">build by ramlal kumawat</p>
        </div>
      </div>
    </footer>
  );
}
