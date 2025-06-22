"use client";

import ProductCreator from "../../../components/ProductCreator";

export default function AddProductPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Product</h1>
        <ProductCreator />
      </div>
    </div>
  );
}
