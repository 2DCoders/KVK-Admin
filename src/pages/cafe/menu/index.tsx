import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Clock,
  ImageOff,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import { getCafeMenu } from "@/services/cafe-api";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: number;
  isActive: boolean;
  facts: string;
  ingredients: string;
  preparationTimeInMinutes: number;
  portionSize: number;
  image: string | null;
};

// The Menu entity has no dedicated "Coffee" category — coffee items are actually filed
// under MenuCategory.Drinks, so it's labeled "Coffee" here to match the real data.
const CATEGORY_OPTIONS = [
  { value: "1", label: "Breakfast" },
  { value: "4", label: "Coffee" },
];

const categoryLabel = (category: number) =>
  CATEGORY_OPTIONS.find((option) => Number(option.value) === category)?.label ?? "Other";

const portionSizeLabel = (size: number) => {
  switch (size) {
    case 1:
      return "For 1";
    case 2:
      return "For 2";
    case 3:
      return "For 3";
    case 4:
      return "For 4";
    default:
      return null;
  }
};

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CafeMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCafeMenu();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: MenuItem[] = Array.isArray(rows)
        ? rows.map((item: any) => ({
            id: item.id,
            name: item.name ?? "",
            description: item.description ?? "",
            price: Number(item.price ?? 0),
            category: Number(item.category ?? 1),
            isActive: !!item.isActive,
            facts: item.facts ?? "",
            ingredients: item.ingredients ?? "",
            preparationTimeInMinutes: Number(item.preparationTimeInMinutes ?? 0),
            portionSize: Number(item.portionSize ?? 0),
            image: item.image || null,
          }))
        : [];

      setItems(mapped);
    } catch {
      setItems([]);
      setError("Failed to load the menu.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (categoryFilter !== "all" && String(item.category) !== categoryFilter) return false;
    if (statusFilter === "active" && !item.isActive) return false;
    if (statusFilter === "inactive" && item.isActive) return false;
    if (!normalizedSearchTerm) return true;

    return [item.name, item.description, item.ingredients]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const hasActiveFilters = categoryFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Menu</h1>
            <p className="text-sm text-gray-500 mt-1">View all cafe menu items</p>
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Search by name, description, or ingredients..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer text-sm font-medium text-blue-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading menu...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No menu items found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const portion = portionSizeLabel(item.portionSize);

              return (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-300"
                >
                  <div className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-gray-50">
                    {item.image ? (
                      <img
                        src={`data:image/jpeg;base64,${item.image}`}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ImageOff size={28} className="text-gray-300" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                      <span
                        className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-1 text-xl font-bold text-blue-900">
                      {formatLkr(item.price)}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {categoryLabel(item.category)}
                      </span>
                      {item.preparationTimeInMinutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {item.preparationTimeInMinutes} min
                        </span>
                      )}
                      {portion && (
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {portion}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {item.ingredients && (
                      <p className="mt-2 text-xs text-gray-400 line-clamp-1">
                        Ingredients: {item.ingredients}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
