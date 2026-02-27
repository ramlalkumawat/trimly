import React from 'react'

// Footer with 4-column layout as per requirements
export default function Footer(){
  return (
    <footer className="bg-gray-900 text-gray-300 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">About Trimly</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Column 2: For Customers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Customers</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">Service Areas</a></li>
              <li><a href="#" className="hover:text-white transition">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition">Reviews</a></li>
            </ul>
          </div>

          {/* Column 3: For Professionals */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Professionals</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Join as a Stylist</a></li>
              <li><a href="#" className="hover:text-white transition">Partner With Us</a></li>
            </ul>
          </div>

          {/* Column 4: Follow Us */}
          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition">YouTube</a></li>
              <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright line */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm">
          © {new Date().getFullYear()} Trimly. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
