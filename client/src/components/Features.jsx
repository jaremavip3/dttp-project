"use client";

const features = [
  {
    icon: "🧠",
    title: "AI-Powered Semantic Search",
    description:
      "Search by describing what you want, not just keywords. Try 'summer vibes', 'minimalist aesthetic', or 'black and red'.",
    examples: ["summer vibes", "black and red", "vintage aesthetic", "cozy winter outfit"],
  },
  {
    icon: "🎯",
    title: "Smart Visual Recognition",
    description: "Our AI understands colors, styles, and moods. Search by emotion, season, or visual style.",
    examples: ["romantic dinner outfit", "professional look", "casual weekend", "party dress"],
  },
  {
    icon: "🚚",
    title: "Free Shipping",
    description: "Free delivery on orders over $50. Fast and reliable shipping worldwide.",
  },
  {
    icon: "🔄",
    title: "Easy Returns",
    description: "30-day return policy. Not satisfied? Return it hassle-free.",
  },
];

export default function Features() {
  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 sm:mb-4">Why Choose StyleAI</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Experience the future of online shopping with AI-powered search
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
              <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{feature.title}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3">{feature.description}</p>

              {/* Search Examples */}
              {feature.examples && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Try searching:</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {feature.examples.slice(0, 2).map((example, exampleIndex) => (
                      <span
                        key={exampleIndex}
                        className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100"
                      >
                        "{example}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced AI Search Section */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-medium text-gray-900 mb-3">How AI Search Works</h3>
            <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto">
              Our advanced AI models understand natural language and visual concepts, making product discovery intuitive
              and powerful.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
                <span className="text-2xl">🎨</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Describe Colors & Styles</h4>
              <p className="text-xs text-gray-600">"burgundy leather jacket" or "pastel summer dress"</p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
                <span className="text-2xl">💭</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Express Moods & Vibes</h4>
              <p className="text-xs text-gray-600">"cozy winter vibes" or "professional confidence"</p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Find by Occasion</h4>
              <p className="text-xs text-gray-600">"date night outfit" or "gym workout clothes"</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/catalog"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try AI Search Now
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
