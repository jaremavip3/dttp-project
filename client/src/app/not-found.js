import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <div>
      <Header title="Page Not Found" />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-9xl font-light text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-light text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on track.
          </p>
          <div className="space-x-4">
            <Link
              href="/"
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Go Home
            </Link>
            <Link
              href="/catalog"
              className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
