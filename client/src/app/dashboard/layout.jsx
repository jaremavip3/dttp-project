export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Dashboard</h3>
        <nav className="space-y-2">
          <a href="/dashboard" className="block text-gray-600 hover:text-gray-900">
            Overview
          </a>
          <a href="/dashboard/settings" className="block text-gray-600 hover:text-gray-900">
            Settings
          </a>
        </nav>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
