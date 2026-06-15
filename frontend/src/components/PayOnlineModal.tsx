"use client";

interface PayOnlineModalProps {
  amount?: string;
  description?: string;
  onClose: () => void;
}

export function PayOnlineModal({ amount, description, onClose }: PayOnlineModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-dark">
        {/* Header */}
        <div className="rounded-t-2xl bg-gradient-to-br from-primary to-primary/80 px-6 py-5 text-white">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Pay Online</h2>
          {description && <p className="mt-0.5 text-sm text-white/80">{description}</p>}
          {amount && (
            <p className="mt-2 text-2xl font-bold">
              BWP {Number(amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-900/20">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Payment Gateway Not Configured
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Your SACCO administrator needs to configure a payment gateway before online payments can be accepted.
              </p>
            </div>
          </div>

          <p className="mb-3 text-sm font-medium text-dark dark:text-white">
            Supported payment providers:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Orange Money", icon: "🟠", desc: "Mobile money" },
              { name: "MyZaka",       icon: "🔵", desc: "Mobile money" },
              { name: "Visa / Mastercard", icon: "💳", desc: "Card payment" },
              { name: "Bank Transfer", icon: "🏦", desc: "Direct debit" },
            ].map((p) => (
              <div key={p.name}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-lg">{p.icon}</span>
                <div>
                  <p className="text-xs font-medium text-dark dark:text-white">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Contact your SACCO administrator to activate your preferred payment provider.
            Once configured, you will be able to pay directly from this portal.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <a
            href="mailto:admin@sacco.com"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            Contact Administrator
          </a>
        </div>
      </div>
    </div>
  );
}
