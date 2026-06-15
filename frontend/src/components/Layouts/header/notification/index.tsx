"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAdminDashboard } from "@/lib/api/dashboard";
import { useSession } from "@/lib/auth/auth-client";
import Link from "next/link";
import { useState } from "react";
import { BellIcon } from "./icons";

// ── Icons ──────────────────────────────────────────────────────────────────

function UserCheckIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none">
      <path d="M9 11a4 4 0 100-8 4 4 0 000 8z" fill="currentColor" opacity=".2" />
      <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm0 0c-3.314 0-6 1.343-6 3v1h9m4-4l1.5 1.5L20 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function LoanIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="11" rx="2" fill="currentColor" opacity=".2" />
      <path d="M2 8h16M6 12h2m3 0h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IssueIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" fill="currentColor" opacity=".2" />
      <path d="M10 6v4m0 3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface NotifItem {
  key: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  href: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const { data: dashboard } = useAdminDashboard();
  const stats = dashboard?.stats;

  const items: NotifItem[] = [];

  if (isAdmin && stats) {
    if (stats.pending_members > 0) {
      items.push({
        key: "pending_members",
        icon: <UserCheckIcon />,
        iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
        title: `${stats.pending_members} member application${stats.pending_members !== 1 ? "s" : ""} pending`,
        subtitle: "Review and approve new members",
        href: "/admin/members",
      });
    }

    if (stats.pending_loan_approvals > 0) {
      items.push({
        key: "pending_loans",
        icon: <LoanIcon />,
        iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
        title: `${stats.pending_loan_approvals} loan${stats.pending_loan_approvals !== 1 ? "s" : ""} awaiting approval`,
        subtitle: "Review loan applications",
        href: "/admin/loans",
      });
    }

    if (stats.open_issues > 0) {
      items.push({
        key: "open_issues",
        icon: <IssueIcon />,
        iconBg: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
        title: `${stats.open_issues} open issue${stats.open_issues !== 1 ? "s" : ""}`,
        subtitle: "Member issues need attention",
        href: "/admin/issues",
      });
    }
  }

  const count = items.length;

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <DropdownTrigger
        className="grid size-12 cursor-pointer place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />
          {count > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 z-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-gray-2 dark:ring-dark-3",
            )}>
              {count}
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md min-[350px]:min-w-[22rem] dark:border-dark-3 dark:bg-gray-dark"
      >
        <div className="mb-2 flex items-center justify-between px-1 py-1">
          <span className="text-base font-semibold text-dark dark:text-white">
            Notifications
          </span>
          {count > 0 && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-white">
              {count} action{count !== 1 ? "s" : ""} needed
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="text-3xl">✓</span>
            <p className="text-sm font-medium text-dark dark:text-white">All caught up</p>
            <p className="text-xs text-gray-400">No pending actions at the moment.</p>
          </div>
        ) : (
          <ul className="mb-3 space-y-1">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}>
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {item.subtitle}
                    </p>
                  </div>
                  <svg className="mt-1 ml-auto shrink-0 text-gray-300" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={isAdmin ? "/admin/dashboard" : "/member/dashboard"}
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-gray-200 p-2 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-dark-3 dark:text-gray-400 dark:hover:bg-dark-3"
        >
          Go to Dashboard
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
