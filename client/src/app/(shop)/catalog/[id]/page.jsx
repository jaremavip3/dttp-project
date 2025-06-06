import Header from "@/components/Header";

export default function ProductPage({ params }) {
  return (
    <div>
      <Header title="Product Details" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Product ID: {params.id}</p>
      </div>
    </div>
  );
}
