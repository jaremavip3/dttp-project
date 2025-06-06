import Header from "@/components/Header";

export default function Home() {
  return (
    <div>
      <Header title="Welcome" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">This is the home page.</p>
      </div>
    </div>
  );
}
