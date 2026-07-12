import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Car,
  CheckSquare,
  ChevronDown,
  Coffee,
  Dumbbell,
  Gamepad2,
  Grid2X2,
  LogOut,
  Menu,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getCategories } from "@/services/categories-api";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose?: () => void;
}

interface NavSubitem {
  id: string;
  label: string;
  path: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  submenu?: NavSubitem[];
}

interface ModuleItem {
  id: string;
  label: string;
  shortLabel: string;
  path: string;
  icon: LucideIcon;
  accentClass: string;
  activeClass: string;
}

interface AdminData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const moduleItems: ModuleItem[] = [
  {
    id: "gym",
    label: "Gym",
    shortLabel: "GY",
    path: "/gym",
    icon: Dumbbell,
    accentClass: "bg-violet-100 text-violet-700",
    activeClass:
      "bg-violet-700 text-white ring-violet-200 shadow-violet-200/70",
  },
  {
    id: "carwash",
    label: "Carwash",
    shortLabel: "CW",
    path: "/carwash",
    icon: Car,
    accentClass: "bg-sky-100 text-sky-700",
    activeClass: "bg-sky-600 text-white ring-sky-200 shadow-sky-200/70",
  },
  {
    id: "badminton",
    label: "Badminton",
    shortLabel: "BD",
    path: "/badminton",
    icon: Trophy,
    accentClass: "bg-amber-100 text-amber-700",
    activeClass:
      "bg-amber-500 text-white ring-amber-200 shadow-amber-200/70",
  },
  {
    id: "gaming",
    label: "Gaming",
    shortLabel: "GM",
    path: "/gaming",
    icon: Gamepad2,
    accentClass: "bg-red-100 text-red-700",
    activeClass: "bg-red-600 text-white ring-red-200 shadow-red-200/70",
  },
  {
    id: "cafe",
    label: "Cafe",
    shortLabel: "CF",
    path: "/cafe",
    icon: Coffee,
    accentClass: "bg-fuchsia-100 text-fuchsia-700",
    activeClass:
      "bg-fuchsia-600 text-white ring-fuchsia-200 shadow-fuchsia-200/70",
  },
];

const navItems: NavItem[] = [
  {
    id: "modules",
    label: "Modules",
    icon: Grid2X2,
    path: "/modules",
  },
  {
    id: "system-settings",
    label: "System Settings",
    icon: Settings,
    submenu: [
      {
        id: "pc-settings",
        label: "PC Settings",
        path: "/pc-settings",
      },
      {
        id: "ps5-settings",
        label: "PS5 Settings",
        path: "/ps5-settings",
      },
      {
        id: "pool-settings",
        label: "Pool Settings",
        path: "/pool-settings",
      },
      {
        id: "movie-room-settings",
        label: "Movie Room Settings",
        path: "/movie-rooms-settings",
      },
    ],
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: CalendarDays,
    path: "/bookings",
  },
  {
    id: "dayend",
    label: "Day End",
    icon: CheckSquare,
    path: "/dayend",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

function getAdminData(): AdminData | null {
  try {
    const storedAdmin = localStorage.getItem("admin");

    if (!storedAdmin) {
      return null;
    }

    return JSON.parse(storedAdmin) as AdminData;
  } catch {
    return null;
  }
}

export default function Sidebar({
  isOpen,
  isMobile,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const collapsed = !isOpen && !isMobile;

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [admin] = useState<AdminData | null>(() => getAdminData());

  const activeModule = useMemo(() => {
    return (
      moduleItems.find(
        (module) =>
          location.pathname === module.path ||
          location.pathname.startsWith(`${module.path}/`),
      )?.id ?? "gaming"
    );
  }, [location.pathname]);

  const currentModule = useMemo(() => {
    return (
      moduleItems.find((module) => module.id === activeModule) ??
      moduleItems[3]
    );
  }, [activeModule]);

  const isActive = (path?: string) => {
    if (!path) {
      return false;
    }

    return (
      location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(`${path}/`))
    );
  };

  const isParentActive = (item: NavItem) => {
    return (
      item.submenu?.some((subitem) => isActive(subitem.path)) ?? false
    );
  };

  const handleGetCategories = async () => {
    try {
      const response = await getCategories();
      localStorage.setItem("categories", JSON.stringify(response));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    void handleGetCategories();
  }, []);

  useEffect(() => {
    const activeParent = navItems.find(
      (item) =>
        item.submenu?.some((subitem) => isActive(subitem.path)) ?? false,
    );

    if (activeParent) {
      setOpenMenu(activeParent.id);
    }
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);

    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleModuleNavigation = (module: ModuleItem) => {
    handleNavigation(module.path);
  };

  const toggleMenu = (id: string) => {
    setOpenMenu((previous) => (previous === id ? null : id));
  };

  const adminInitials = `${admin?.firstName?.charAt(0) ?? ""}${
    admin?.lastName?.charAt(0) ?? ""
  }`.toUpperCase();

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
        />
      )}

      <aside
        className={`
          ${
            isMobile
              ? "fixed inset-y-0 left-0 z-50"
              : "relative h-full"
          }
          flex h-full overflow-hidden border-r border-slate-200
          bg-white shadow-[8px_0_30px_rgba(15,23,42,0.06)]
          transition-all duration-300 ease-in-out
          ${
            isMobile
              ? isOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : ""
          }
          ${collapsed ? "w-[68px]" : "w-[300px]"}
        `}
      >
        {/* Left module rail */}
        <div className="flex h-full w-[68px] shrink-0 flex-col items-center border-r border-slate-200 bg-slate-50/80">
          {/* Logo */}
          <div className="flex h-[66px] w-full items-center justify-center border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleNavigation("/")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-[11px] font-bold tracking-wide text-white shadow-sm transition hover:scale-105"
            >
              KVK
            </button>
          </div>

          {/* Module icons */}
          <div className="flex flex-1 flex-col items-center gap-2 overflow-hidden px-2 py-3">
            {moduleItems.map((module) => {
              const Icon = module.icon;
              const active = activeModule === module.id;

              return (
                <div key={module.id} className="group relative">
                  <button
                    type="button"
                    aria-label={module.label}
                    onClick={() => handleModuleNavigation(module)}
                    className={`
                      flex h-11 w-11 items-center justify-center rounded-xl
                      ring-2 ring-transparent transition-all duration-200
                      hover:-translate-y-0.5 hover:shadow-md
                      ${
                        active
                          ? `${module.activeClass} shadow-lg`
                          : `${module.accentClass} hover:ring-slate-200`
                      }
                    `}
                  >
                    <Icon size={19} strokeWidth={2.2} />
                  </button>

                  <div className="pointer-events-none absolute left-[54px] top-1/2 z-[80] -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all group-hover:translate-x-0 group-hover:opacity-100">
                    {module.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rail bottom button */}
          <div className="border-t border-slate-200 px-2 py-3">
            <button
              type="button"
              aria-label="Open modules"
              onClick={() => handleNavigation("/modules")}
              className={`
                flex h-11 w-11 items-center justify-center rounded-xl
                transition-all
                ${
                  isActive("/modules")
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }
              `}
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        {/* Main sidebar column */}
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col bg-white">
            {/* Main header */}
            <header className="flex h-[66px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <button
                type="button"
                onClick={() => handleNavigation(currentModule.path)}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <span
                  className={`
                    flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                    ${currentModule.accentClass}
                  `}
                >
                  <currentModule.icon size={17} />
                </span>

                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-slate-900">
                      KVK {currentModule.label}
                    </span>

                    <ChevronDown
                      size={14}
                      className="shrink-0 text-slate-400"
                    />
                  </span>

                  <span className="block text-[11px] font-medium text-slate-500">
                    Administration panel
                  </span>
                </span>
              </button>

              {isMobile && (
                <button
                  type="button"
                  aria-label="Close sidebar"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={18} />
                </button>
              )}
            </header>

            {/* Navigation */}
            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Main menu
              </p>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.submenu
                    ? isParentActive(item)
                    : isActive(item.path);

                  const menuOpen = openMenu === item.id;

                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.submenu?.length) {
                            toggleMenu(item.id);
                            return;
                          }

                          if (item.path) {
                            handleNavigation(item.path);
                          }
                        }}
                        className={`
                          flex w-full items-center justify-between rounded-xl
                          px-3 py-2.5 text-left transition-all duration-150
                          ${
                            active
                              ? "bg-slate-100 text-slate-950"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          }
                        `}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`
                              flex h-8 w-8 shrink-0 items-center justify-center
                              rounded-lg transition-colors
                              ${
                                active
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-500"
                              }
                            `}
                          >
                            <Icon size={16} />
                          </span>

                          <span
                            className={`
                              truncate text-sm
                              ${
                                active
                                  ? "font-semibold text-slate-950"
                                  : "font-medium"
                              }
                            `}
                          >
                            {item.label}
                          </span>
                        </span>

                        {item.submenu && (
                          <ChevronDown
                            size={16}
                            className={`
                              shrink-0 text-slate-400 transition-transform
                              ${menuOpen ? "rotate-180" : ""}
                            `}
                          />
                        )}
                      </button>

                      {item.submenu && menuOpen && (
                        <div className="relative ml-7 mt-1 space-y-1 border-l border-slate-200 py-1 pl-5">
                          {item.submenu.map((subitem) => {
                            const subitemActive = isActive(subitem.path);

                            return (
                              <button
                                key={subitem.id}
                                type="button"
                                onClick={() =>
                                  handleNavigation(subitem.path)
                                }
                                className={`
                                  relative flex w-full items-center rounded-lg
                                  px-3 py-2 text-left text-[13px] transition
                                  ${
                                    subitemActive
                                      ? "bg-blue-50 font-semibold text-blue-700"
                                      : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                  }
                                `}
                              >
                                {subitemActive && (
                                  <span className="absolute -left-[22px] h-5 w-[2px] rounded-full bg-blue-600" />
                                )}

                                {subitem.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>

            {/* Footer */}
            <footer className="shrink-0 border-t border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-medium text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                System online
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
                  {adminInitials || "AD"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {admin?.firstName || "System"}{" "}
                    {admin?.lastName || "Administrator"}
                  </p>

                  <p className="truncate text-[11px] text-slate-500">
                    {admin?.email || "Administrator account"}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Logout"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </footer>
          </div>
        )}
      </aside>
    </>
  );
}