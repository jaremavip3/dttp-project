import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryGrid from "@/components/CategoryGrid";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import { products } from "@/data/products";

export default function Home() {
  // Get featured products (bestsellers and new arrivals)
  const featuredProducts = products.filter((product) => product.isBestSeller || product.isNew);
  const bestSellers = products.filter((product) => product.isBestSeller);
  const newArrivals = products.filter((product) => product.isNew);

  return (
    <div>
      <Header title="Home" />

      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products */}
      <FeaturedProducts products={featuredProducts} title="Featured Products" />

      {/* Category Grid */}
      <CategoryGrid />

      {/* Best Sellers */}
      {bestSellers.length > 0 && <FeaturedProducts products={bestSellers} title="Best Sellers" />}

      {/* New Arrivals */}
      {newArrivals.length > 0 && <FeaturedProducts products={newArrivals} title="New Arrivals" />}

      {/* Features */}
      <Features />

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
}
