"use client";

import Link from "next/link";

export default function Newsletter() {
  return (
    <section className="py-16 px-4 bg-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-light text-white mb-4">Stay Updated</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Get the latest updates on new arrivals, exclusive offers, and AI search improvements.
        </p>

        <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
          />
          <button className="bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium whitespace-nowrap">
            Subscribe
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-4">No spam, unsubscribe at any time. Privacy policy applies.</p>
      </div>
    </section>
  );
}
