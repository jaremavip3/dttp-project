import Header from "@/components/Header";

export default function LoginPage() {
  return (
    <div>
      <Header title="Login" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" className="mt-1 w-full p-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" className="mt-1 w-full p-2 border border-gray-300 rounded" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
