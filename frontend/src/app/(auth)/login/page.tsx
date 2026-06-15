import Signin from "@/components/Auth/Signin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

const FEATURES = [
  { label: "Manage savings accounts & view statements" },
  { label: "Apply for loans and track repayment schedules" },
  { label: "Monitor contributions, shares & dividends" },
  { label: "Request commodities on credit" },
  { label: "Raise and track service desk issues" },
];

export default function SignIn() {
  return (
    <div className="flex min-h-screen">
      {/* ── Branding panel ─────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden xl:flex xl:w-5/12 flex-col justify-between bg-[#0d4f35] p-12 text-white">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-40 right-8 h-40 w-40 rounded-full bg-white/5" />

        {/* Wordmark */}
        <div className="relative z-10">
          <span className="text-2xl font-bold tracking-wide text-white">
            Jwaneng SACCOS
          </span>
        </div>

        {/* Core branding */}
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Jwaneng SACCOS
            </h1>
            <p className="mt-1 text-base font-medium text-white/70">
              Jwaneng Savings and Credit Cooperative Society
            </p>
          </div>

          <div className="h-px w-16 bg-white/30" />

          <p className="text-sm italic text-white/60 leading-relaxed max-w-xs">
            &ldquo;Empowering members through cooperative savings and financial
            inclusion since inception.&rdquo;
          </p>

          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg
                    className="h-3 w-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-sm text-white/80">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex flex-col gap-1 text-xs text-white/40">
          <span className="mt-1">
            &copy; {new Date().getFullYear()} Jwaneng SACCOS. All rights reserved.
          </span>
        </div>
      </div>

      {/* ── Form panel ─────────────────────────────────────────────── */}
      <div className="flex w-full xl:w-7/12 items-center justify-center bg-white px-6 py-12 dark:bg-gray-dark">
        <div className="w-full max-w-md">
          {/* Mobile wordmark — hidden on xl where the branding panel shows */}
          <div className="mb-8 flex flex-col items-center xl:hidden">
            <span className="text-xl font-bold text-dark dark:text-white">
              Jwaneng SACCOS
            </span>
            <p className="mt-1 text-xs text-gray-400">
              Jwaneng Savings and Credit Cooperative Society
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark dark:text-white">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your Jwaneng SACCOS account
            </p>
          </div>

          <Signin />

          <p className="mt-10 text-center text-xs text-gray-300 dark:text-gray-600 xl:hidden">
            &copy; {new Date().getFullYear()} Jwaneng SACCOS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
