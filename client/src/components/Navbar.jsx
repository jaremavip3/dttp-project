export default function Navbar() {
  return (
    <nav className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="font-semibold text-lg">Logo</div>
          <div className="flex space-x-4">
            <a href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </a>
            <a href="/catalog" className="text-gray-600 hover:text-gray-900">
              Catalog
            </a>
            <a href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
