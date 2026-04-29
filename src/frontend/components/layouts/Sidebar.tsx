"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/frontend/hooks";
import { cn } from "@/frontend/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faUserGraduate,
  faChalkboardTeacher,
  faLayerGroup,
  faFileAlt,
  faQuestionCircle,
  faRightFromBracket,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface NavItem {
  name: string;
  href: string;
  icon: IconDefinition;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: faGauge },
  { name: "Estudiantes", href: "/estudiantes", icon: faUserGraduate },
  { name: "Profesores", href: "/profesores", icon: faChalkboardTeacher },
  { name: "Grupos y Materias", href: "/grupos", icon: faLayerGroup },
  { name: "Documentos", href: "/documentos", icon: faFileAlt },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7A154A]">
          <FontAwesomeIcon
            icon={faGraduationCap}
            className="text-white text-lg"
          />
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">MiCicata</span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Gestión Académica
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#7A154A] text-white shadow-sm"
                  : "text-gray-600 hover:bg-rose-50 hover:text-[#7A154A]"
              )}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={cn("w-4", isActive ? "text-white" : "text-gray-400")}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 px-3 py-4">
        {/* User info */}
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-rose-50 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7A154A] text-xs font-bold text-white">
            {user?.username?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user?.username ?? "Admin"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {user?.email ?? "admin@ipn.mx"}
            </p>
          </div>
        </div>

        <Link
          href="/ayuda"
          className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faQuestionCircle} className="w-4 text-gray-400" />
          Ayuda
        </Link>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

