export default function Header({ title, children }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {children}
      </div>
    </header>
  );
}
