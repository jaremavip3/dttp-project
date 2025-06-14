"use client";

const features = [
  {
    icon: "🧠",
    title: "AI-Powered Search",
    description: "Find products using natural language. Just describe what you're looking for.",
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
  {
    icon: "🎯",
    title: "Curated Selection",
    description: "Carefully selected products that match modern style and quality standards.",
  },
];

export default function Features() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-gray-600">Experience the future of online shopping</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-medium text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
