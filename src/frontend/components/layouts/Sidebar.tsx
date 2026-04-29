"use client";

import { useState } from "react";
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
  faBars,
  faXmark,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => setMobileOpen(false);

  const sidebarContent = (
    <>
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
              onClick={handleNavClick}
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
          onClick={handleNavClick}
          className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faQuestionCircle} className="w-4 text-gray-400" />
          Ayuda
        </Link>

        <button
          onClick={() => { handleNavClick(); logout(); }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A154A]">
            <FontAwesomeIcon icon={faGraduationCap} className="text-white text-sm" />
          </div>
          <span className="text-base font-bold text-gray-900">MiCicata</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} className="text-lg" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}

