import Filter from "@/components/Filter";

export default function CatalogLayout({ children }) {
  return (
    <div className="flex">
      <Filter />
      <div className="flex-1">{children}</div>
    </div>
  );
}
