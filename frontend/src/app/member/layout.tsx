import { Header } from "@/components/Layouts/header";
import { MemberSidebar } from "@/components/Layouts/sidebar/member-sidebar";
import { type PropsWithChildren } from "react";

export default function MemberLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen">
      <MemberSidebar />

      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-(--breakpoint-2xl) overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
