"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "◉" },
  { href: "/movimientos", label: "Movimientos", icon: "☰" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface md:inset-y-0 md:right-auto md:w-56 md:flex-col md:gap-1 md:border-t-0 md:border-r md:p-4"
    >
      <p className="hidden px-3 py-4 text-xl font-semibold md:block">Finanzas</p>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-sm focus-visible:outline-2 focus-visible:outline-accent-soft md:min-h-11 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 ${
            isActive(item.href) ? "text-accent-soft md:bg-bg" : "text-muted"
          }`}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
