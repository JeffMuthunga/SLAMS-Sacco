"use client";

import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useOrgBranding } from "@/components/BrandingProvider";

export function Header() {
  const { toggleSidebar } = useSidebarContext();
  const { orgName } = useOrgBranding();

  return (
    <header className="border-stroke shadow-1 dark:border-stroke-dark dark:bg-gray-dark sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-5 md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="dark:border-stroke-dark rounded-lg border px-1.5 py-1 lg:hidden dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A]"
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      <div className="max-xl:hidden">
        <p className="text-sm font-semibold text-dark dark:text-white">
          {orgName ?? "Management System"}
        </p>
      </div>

      <div className="2xsm:gap-4 flex flex-1 items-center justify-end gap-2">
        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
