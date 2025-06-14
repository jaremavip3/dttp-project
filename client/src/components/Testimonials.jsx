"use client";

const testimonials = [
  {
    quote: "The AI search is incredible! I just typed 'cozy winter sweater' and found exactly what I was looking for.",
    author: "Sarah M.",
    rating: 5,
  },
  {
    quote: "Finally, a shopping site that understands what I mean. No more scrolling through hundreds of products.",
    author: "James K.",
    rating: 5,
  },
  {
    quote: "Fast shipping, great quality, and the search actually works. What more could you want?",
    author: "Maria L.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-gray-600">Join thousands of satisfied shoppers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4 italic">"{testimonial.quote}"</blockquote>
              <cite className="text-sm font-medium text-gray-900">{testimonial.author}</cite>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
