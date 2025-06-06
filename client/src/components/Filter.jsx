export default function Filter() {
  return (
    <div className="w-64 p-4 border-r border-gray-200">
      <h3 className="font-semibold mb-4">Filters</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select className="w-full p-2 border border-gray-300 rounded">
            <option>All Categories</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <select className="w-full p-2 border border-gray-300 rounded">
            <option>All Prices</option>
          </select>
        </div>
      </div>
    </div>
  );
}
