export default function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">{children}</div>;
}

export function GridItem({ title, price, image }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 rounded mb-4 flex items-center justify-center">
        {image || <span className="text-gray-400">Image</span>}
      </div>
      <h3 className="font-medium text-gray-900 mb-2">{title || "Product Title"}</h3>
      <p className="text-gray-600">{price || "$0.00"}</p>
    </div>
  );
}
