"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BuildingOfficeIcon, 
  CurrencyDollarIcon, 
  CalendarDaysIcon 
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "General", href: "/admin/settings/general", icon: BuildingOfficeIcon },
  { name: "Currencies", href: "/admin/settings/currencies", icon: CurrencyDollarIcon },
  { name: "Fiscal Years", href: "/admin/settings/fiscal-years", icon: CalendarDaysIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col gap-y-8 lg:flex-row lg:gap-x-12">
        <aside className="lg:w-64 lg:shrink-0">
          <nav className="flex flex-1 flex-col" aria-label="Sidebar">
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isCurrent = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        isCurrent
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isCurrent ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-600",
                          "h-6 w-6 shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
